const axios = require("axios");
const bodyParser = require("body-parser");
const express = require("express");

const PORT = 4003;

const app = express();
app.use(bodyParser.json());

app.post("/events", async (req, res) => {
  const { type, data } = req.body;

  /**
   * Perform comment moderation, and then emit a COMMENT_MODERATED
   * event to the event bus.
   */
  if (type === "CommentCreated") {
    const status = data.content.includes("orange") ? "rejected" : "approved";

    await axios
      .post("http://event-bus-srv:4005/events", {
        type: "CommentModerated",
        data: {
          id: data.id,
          postId: data.postId,
          status,
          content: data.content,
        },
      })
      .catch((err) => console.error(err));
  }

  res.send({});
});

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
