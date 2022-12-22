const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
const { randomBytes } = require("crypto");

const PORT = 4000;
const app = express();
app.use(bodyParser.json());
app.use(cors());

// storing in memory for now for this toy project
const posts = {};

/**
 * Deprecated.
 * Client now requests from the query service.
 */
app.get("/posts", (req, res) => {
  res.send(posts);
});

app.post("/posts/create", async (req, res) => {
  const id = randomBytes(4).toString("hex");
  const { title } = req.body;
  posts[id] = { id, title };

  // send an event to our event bus
  await axios
    // this url name is defined in k8s config
    .post("http://event-bus-srv:4005/events", {
      type: "PostCreated",
      data: {
        id,
        title,
      },
    })
    .catch((err) => console.error(err));

  res.status(201).send(posts[id]);
});

// endpoint for service to receive events from event bus
app.post("/events", (req, res) => {
  console.log("Received Event", req.body.type);
  res.send({});
});

app.listen(PORT, () => {
  console.log(`Listening on PORT ${PORT}`);
});
