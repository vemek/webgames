import consumer from "./channels/consumer"

window.addEventListener("load", () => {
  const canvas = document.querySelector("#fake-artist");
  const cx = canvas.getContext("2d");
  const statusbar = document.querySelector("#statusbar");
  const username = document.querySelector("#username");
  const userId = dodgyUuid();
  const playerColour = "#" + Math.floor(Math.random()*16777215).toString(16);

  cx.lineCap = "round";

  enableDrawing();

  const drawingChannel = consumer.subscriptions.create("DrawingChannel", {
    connected() {
      console.log("Connected to DrawingChannel");
    },

    disconnected() {
      // Called when the subscription has been terminated by the server
    },

    received(moveData) {
      if (moveData.userId == userId) {
        return;
      }
      drawMove(moveData);
    },

    broadcastMove(move) {
      this.perform("broadcast_drawing", move);
    }
  });

  function dodgyUuid() {
    // https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
    // low quality random source, but acceptable for what we need
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function enableDrawing() {
    canvas.addEventListener("mousedown", captureDrawing, { once: true });
    setStatus("Drawing enabled 🎨 ✍️");

    setTimeout(enableDrawing, 3000);
  }

  function captureDrawing(event) {
    if (event.which != 1) {
      return;
    }

    cx.strokeStyle = playerColour;
    cx.beginPath();

    var pos = relativePosition(event);
    cx.moveTo(pos.x, pos.y);
    var points = [{ x: pos.x, y: pos.y }];
    trackDrag(function(event) {
      pos = relativePosition(event);
      points.push({ x: pos.x, y: pos.y });
      cx.lineTo(pos.x, pos.y);
      cx.stroke();
    }, () => {
      drawingChannel.broadcastMove({
        userId: userId,
        colour: playerColour,
        points
      });
    });

    event.preventDefault();
  }

  function relativePosition(event) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: Math.floor(event.clientX - rect.left),
      y: Math.floor(event.clientY - rect.top)
    }
  }

  // TODO: remove onEnd if we don't want eraser
  function trackDrag(onMove, onEnd) {
    function end(event) {
      removeEventListener("mousemove", onMove);
      removeEventListener("mouseup", end);
      if (onEnd) {
        onEnd(event);
      }
      setStatus("Waiting for turn ⏳");
    }
    addEventListener("mousemove", onMove);
    addEventListener("mouseup", end);
  }

  function setStatus(text) {
    statusbar.textContent = text;
  }

  function drawMove(move) {
    cx.strokeStyle = move.colour;

    cx.beginPath();
    var initialPoint = move.points.unshift();
    cx.moveTo(initialPoint.x, initialPoint.y);
    move.points.forEach(point => {
      cx.lineTo(point.x, point.y);
    });
    cx.stroke();
  }
});
