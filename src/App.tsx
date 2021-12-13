import { useCallback, useState, useRef, useEffect } from "react";
import { usePosition } from "use-position";
import { getDistance } from "geolib";
import TimePicker from "rc-time-picker";
import moment from "moment";

import "./App.css";
import "rc-time-picker/assets/index.css";

import alarmMp3 from "./alarm.mp3";
import blankMp3 from "./blank.mp3";

function App() {
  const [alarm, setAlarm] = useState<moment.Moment | null>(null);
  const [alarmSet, setAlarmSet] = useState(false);
  const [stopDistance, setStopDistance] = useState(10);
  const audioRef = useRef<HTMLAudioElement>(null);

  const { latitude, longitude, timestamp, accuracy } = usePosition(true, {
    enableHighAccuracy: true,
    timeout: Infinity,
    maximumAge: 0,
  });

  interface ICoords {
    latitude: number;
    longitude: number;
  }

  const [startCoords, setStartCoords] = useState<ICoords | null>(null);
  useEffect(() => {
    if (latitude && longitude && !startCoords) {
      setStartCoords({ latitude, longitude });
    }
  }, [latitude, longitude, startCoords]);

  const distance =
    startCoords && latitude && longitude
      ? getDistance(startCoords, { latitude, longitude }, 0.01)
      : 0;

  useEffect(() => {
    if (alarmSet && distance > stopDistance) {
      setAlarmSet(false);
      setAlarm(null);
    }
  }, [distance, alarmSet]);

  const showAlarm = () => {
    console.log("ALARM! Wake up!");
    audioRef.current?.play();

    if (!("Notification" in window)) {
      alert("This browser does not support desktop notification");
    } else if (Notification.permission === "granted") {
      var notification = new Notification("Wake up!");
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(function (permission) {
        // If the user accepts, let's create a notification
        if (permission === "granted") {
          var notification = new Notification("Wake up!");
        }
      });
    }
  };

  const registerAlarm = useCallback(() => {
    if (alarm) {
      audioRef.current?.play().then(() => {
        setAlarmSet(true);
        if (latitude && longitude) setStartCoords({ latitude, longitude });
        const delay = alarm.diff(moment());
        console.log("set alarm", delay);
        setTimeout(() => {
          showAlarm();
        }, delay);
      });
    }
  }, [alarm]);

  return (
    <div className="App">
      <div className="App-header">
        <TimePicker
          defaultValue={moment().add(1, "hour")}
          value={alarm ?? undefined}
          onChange={(newTime) => setAlarm(newTime)}
          showSecond={false}
        />
        <input
          type="number"
          placeholder="distance"
          min={1}
          value={stopDistance}
          onChange={(e) => setStopDistance(parseInt(e.target.value, 10))}
        />
        <p>
          <button type="button" onClick={registerAlarm}>
            Set alarm
          </button>
          {alarmSet && (
            <button
              type="button"
              onClick={() => {
                setAlarm(null);
                setAlarmSet(false);
              }}
            >
              Reset
            </button>
          )}
        </p>
        <audio src={alarmSet ? alarmMp3 : blankMp3} ref={audioRef} />
        {startCoords && (
          <code>
            original: {startCoords.latitude}, {startCoords.longitude}
            <br />
            current: {latitude}, {longitude}
            <br />
            accuracy: {accuracy && `${accuracy} meters`}
            <br />
            distance: {distance && `${distance} meters`}
          </code>
        )}
      </div>
    </div>
  );
}

export default App;
