const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
const { randomBytes } = require("crypto");

const PORT = 4001;
const app = express();
app.use(bodyParser.json());
app.use(cors());

// storing in memory for now for this toy project
// { postId: [{ commentId: comment }, { commentId: comment }]}
const commentsByPostId = {};

app.get("/posts/:id/comments", (req, res) => {
  res.send(commentsByPostId[req.params.id] || []);
});

app.post("/posts/:id/comments", (req, res) => {
  const commentId = randomBytes(4).toString("hex");
  const { content } = req.body;
  const { id: postId } = req.params;

  const comments = commentsByPostId[postId] || [];
  comments.push({ id: commentId, content, status: "pending" });
  commentsByPostId[postId] = comments;

  // Emit COMMENT_CREATED event.
  axios.post("http://event-bus-srv:4005/events", {
    type: "CommentCreated",
    data: {
      id: commentId,
      content,
      postId,
      status: "pending",
    },
  });

  res.status(201).send(comments);
});

// endpoint for service to receive events from event bus
app.post("/events", async (req, res) => {
  const { type, data } = req.body;

  if (type === "CommentModerated") {
    const { postId, id, status, content } = data;
    const comments = commentsByPostId[postId];

    const comment = comments.find((comment) => comment.id === id);
    comment.status = status;

    // Emit COMMENT_UPDATED event.
    await axios
      .post("http://event-bus-srv:4005/events", {
        type: "CommentUpdated",
        data: {
          id,
          postId,
          status,
          content,
        },
      })
      .catch((err) => console.error(err));
  }

  res.send({});
});

app.listen(PORT, () => {
  console.log(`Listening on PORT ${PORT}`);
});
