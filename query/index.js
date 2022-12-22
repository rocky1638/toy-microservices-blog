const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");

const PORT = 4002;

/**
 * posts === {
 *    post_id: {
 *      id:
 *      title:
 *      comments: {...}
 *  }...
 * }
 */
const posts = {};

/**
 *
 * @param {EVENT_TYPE} type
 * @param {OBJECT} data
 *
 * For handling and listening to events that
 * are emitted from the event bus (from other services).
 */
const handleEvent = (type, data) => {
  if (type === "PostCreated") {
    const { id, title } = data;

    posts[id] = {
      id,
      title,
      comments: [],
    };
  }

  if (type === "CommentCreated") {
    const { id, content, postId, status } = data;
    const post = posts[postId];

    post.comments.push({ id, content, status });
  }

  if (type === "CommentUpdated") {
    const { id, content, postId, status } = data;
    const post = posts[postId];

    comment = post.comments.find((comment) => comment.id === id);

    comment.status = status;
    comment.content = content;
  }
};

const app = express();
app.use(bodyParser.json());
app.use(cors());

/**
 * The client will GET this endpoint to fetch all posts and comments.
 *
 * This consolidates requests and removes the need for each post to call the
 * comment service individually to fetch comments.
 */
app.get("/posts", (req, res) => {
  res.send(posts);
});

// endpoint for service to receive events from event bus
app.post("/events", (req, res) => {
  const { type, data } = req.body;
  handleEvent(type, data);
  res.send({});
});

app.listen(PORT, async () => {
  console.log(`Listening on ${PORT}`);

  // Go through past events and process any that we missed
  // since we were offline.
  try {
    const res = await axios.get("http://event-bus-srv:4005/events");
    res.data.forEach((event) => {
      console.log("Processing event:", event.type);

      handleEvent(event.type, event.data);
    });
  } catch (err) {
    console.error(err);
  }
});
