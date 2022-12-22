const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const PORT = 4005;

const app = express();
app.use(bodyParser.json());

// Data store for storing every event in history.
const events = [];

/**
 * Returns all events created.
 *
 * (Internal route).
 */
app.get("/events", (req, res) => {
  res.send(events);
});

/**
 * This endpoint is posted to from the comments and posts services
 * whenever a post or comment is created.
 *
 * These events are then dispatched to all relevant services on POST /events,
 * including to the original service that sent the event, as well as the
 * query service on PORT 4002.
 *
 * (Internal route).
 */
app.post("/events", (req, res) => {
  const event = req.body;

  events.push(event);

  // POSTS SERVICE
  axios
    .post("http://posts-clusterip-srv:4000/events", event)
    .catch((err) => console.error(err));
  // COMMENTS SERVICE
  axios
    .post("http://comments-srv:4001/events", event)
    .catch((err) => console.error(err));
  // QUERY SERVICE
  axios
    .post("http://query-srv:4002/events", event)
    .catch((err) => console.error(err));
  // MODERATION SERVICE
  axios
    .post("http://moderation-srv:4003/events", event)
    .catch((err) => console.error(err));

  res.send({ status: "OK" });
});

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
