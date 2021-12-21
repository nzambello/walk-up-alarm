import { useCallback, useState, useRef, useEffect } from "react";
import { usePosition } from "use-position";
import { getDistance } from "geolib";
import { format, parse, differenceInMilliseconds, isMatch } from "date-fns";
import useStayAwake from "use-stay-awake";

import { TextField, Button, Dialog, Card } from "ui-neumorphism";
import { overrideThemeVariables } from "ui-neumorphism";

import "ui-neumorphism/dist/index.css";
import "./App.css";

import alarmMp3 from "./alarm.mp3";
import blankMp3 from "./blank.mp3";

function App() {
  const [alarm, setAlarm] = useState<Date | null>(null);
  const [alarmSet, setAlarmSet] = useState(false);
  const [alarmPlaying, setAlarmPlaying] = useState(false);
  const [hasWalked, setHasWalked] = useState(false);
  const [stopDistance, setStopDistance] = useState(10);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    overrideThemeVariables({
      "--dark-bg": "#3E3D42",
      "--dark-bg-dark-shadow": "#323135",
      "--dark-bg-light-shadow": "#4a494f",
      "--primary": "#2979ff",
      "--primary-dark": "#2962ff",
      "--primary-light": "#82b1ff",
    });
  }, []);

  const device = useStayAwake();

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
      resetAlarm();
    } else {
      setHasWalked(false);
      setAlarmPlaying(true);
      audioRef.current?.play();
    }
  }, [distance, alarmSet]);

  const resetAlarm = () => {
    setHasWalked(true);
    setAlarmSet(false);
    setAlarmPlaying(false);
    setAlarm(null);
    audioRef.current?.pause();
    if (device.canSleep) {
      device.allowSleeping();
    }
  };

  const showAlarm = () => {
    console.log("ALARM! Wake up!");
    setAlarmPlaying(true);
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
        const delay = differenceInMilliseconds(alarm, new Date());
        console.log("set alarm", delay);
        if (device.canSleep) {
          device.preventSleeping();
        }
        setTimeout(() => {
          showAlarm();
        }, delay);
      });
    }
  }, [alarm]);

  const appState =
    hasWalked && alarmPlaying
      ? "has-walked"
      : alarmPlaying
      ? "alarm-playing"
      : alarmSet
      ? "alarm-set"
      : "";

  const [clock, setClock] = useState<string>(format(new Date(), "HH:mm"));
  useEffect(() => {
    const interval = setInterval(() => {
      if (!clock.includes(":") || alarmPlaying)
        setClock(format(new Date(), "HH:mm"));
      else setClock(format(new Date(), "HH mm"));
    }, 1000);
    return () => clearInterval(interval);
  });

  const [showResetModal, setResetModal] = useState(false);

  return (
    <div className={`App theme--dark ${appState}`}>
      <div className="App-header">
        {alarmSet && alarm ? (
          <p>
            <span className="clock">{clock}</span>
            <small>Alarm: {format(alarm, "HH:mm")}</small>
          </p>
        ) : (
          <>
            <h1>Alarm clock</h1>
            <div className="input-wrapper">
              <label htmlFor="alarm-time">Set time for the alarm</label>
              {/* <TimeField
                input={
                  <TextField
                    dark
                    rounded
                    id="alarm-time"
                    className="time-picker"
                    placeholder="08:00"
                    uncontrolled
                  />
                }
                value={alarm ? format(alarm, "HH:mm") : undefined}
                onChange={(e) => {
                  setAlarm(parse(e.target.value, "HH:mm", new Date()));
                }}
              /> */}
              <TextField
                dark
                rounded
                id="alarm-time"
                className="time-picker"
                placeholder="08:00"
                value={alarm ? format(alarm, "HH:mm") : undefined}
                onChange={({ value }: { value: string }) => {
                  console.log(value);
                  if (isMatch(value, "HH:mm") || isMatch(value, "H:mm")) {
                    setAlarm(parse(value, "HH:mm", new Date()));
                  }
                }}
              />
            </div>
            <div className="input-wrapper">
              <label htmlFor="stop-distance">Stop alarm after (meters):</label>
              <TextField
                dark
                rounded
                className="stop-distance"
                type="number"
                id="stop-distance"
                placeholder="distance"
                value={stopDistance?.toString() ?? "1"}
                onChange={(e: { target: { value: string } }) =>
                  setStopDistance(parseInt(e.target.value, 10))
                }
              />
            </div>
          </>
        )}
        <div>
          {!alarmSet && (
            <Button dark rounded onClick={registerAlarm} disabled={!alarm}>
              Set alarm
            </Button>
          )}
          {alarmSet && (
            <Button dark text onClick={() => setResetModal(true)}>
              Reset
            </Button>
          )}
          <Dialog
            dark
            minWidth={300}
            visible={showResetModal}
            onClose={() => setResetModal(false)}
          >
            <Card className="pa-4 ma-4">
              Are you sure? <br /> <br />
              <Button
                dark
                color="var(--primary)"
                rounded
                onClick={() => setResetModal(false)}
              >
                close
              </Button>
              <Button
                dark
                rounded
                onClick={() => {
                  resetAlarm();
                  setResetModal(false);
                }}
                className="ml-2"
              >
                reset
              </Button>
            </Card>
          </Dialog>
          {alarmPlaying && distance && (
            <p className="distance">
              Distance: {distance.toFixed(2)} / {stopDistance} meters
            </p>
          )}
        </div>
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
