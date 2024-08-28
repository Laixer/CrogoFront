





window.addEventListener("gamepadconnected", (e) => {
  console.log(
    "Gamepad connected at index %d: %s. %d buttons, %d axes.",
    e.gamepad.index,
    e.gamepad.id,
    e.gamepad.buttons.length,
    e.gamepad.axes.length,
  );
});

function scaleAxisValue(axisValue) {
  // Ensure the input is within the [-1, 1] range
  axisValue = Math.max(-1, Math.min(1, axisValue));

  // Scale the value
  return Math.round(axisValue * 32000);
}

const gamepad_state = {
  buttons: [],
  axes: []
};

const actuator_translation = {
  0: 1, // SLEW
  1: 4, // ARM
  2: 5, // ATTACHMENT
  3: 0, // BOOM
}

let state = null

function checkGamepad() {
  // Function to handle gamepad input
  function handleGamepad() {
    const gamepads = navigator.getGamepads();
    for (let gamepad of gamepads) {
      if (gamepad) {
        state = gamepad_state.buttons[1];
        if (gamepad.buttons[1].pressed) {
          if (!gamepad_state.buttons[1]) {
            gamepad_state.buttons[1] = true;
            console.log("Button 1 pressed");

            sendMotionStopAllCommand();
          }
        } else {
          if (gamepad_state.buttons[1]) {
            gamepad_state.buttons[1] = false;
            console.log("Button 1 released");

            sendMotionResumeAllCommand();
          }
        }

        for (let i = 0; i < 4; i++) {
          // const scaledValue = scaleAxisValue(gamepad.axes[i]);
          // console.log(`Axis ${i} scaled value: ${scaledValue}`);


          if (Math.abs(gamepad.axes[i]) !== 0.0) {
            state = gamepad_state.axes[i];
            const scaledValue = scaleAxisValue(gamepad.axes[i]);
            if (state !== scaledValue) {
              gamepad_state.axes[i] = scaledValue;

              const commandControl = {
                type: "command",
                topic: "motion",
                payload: {
                  type: 16,
                  change: [
                    {
                      actuator: actuator_translation[i],
                      value: scaledValue
                    }
                  ]
                }
              };

              console.log(`Axis ${i} scaled value: ${scaledValue}`);
              webSocket.send(JSON.stringify(commandControl));
            }
          }

        }
      }
    }
  }

  // Set up the interval to check every 10ms
  setInterval(handleGamepad, 10);
}

// Start checking for gamepad input
checkGamepad();