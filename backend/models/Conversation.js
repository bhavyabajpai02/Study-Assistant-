import mongoose from "mongoose"

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
)

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      default: "New Study Chat",
      trim: true
    },
    studyContext: {
      sessionId: { type: String, default: null },
      topic: { type: String, default: "" },
      studyMaterial: { type: String, default: "" }
    },
    messages: [messageSchema]
  },
  {
    timestamps: true
  }
)

export const Conversation = mongoose.model("Conversation", conversationSchema)
