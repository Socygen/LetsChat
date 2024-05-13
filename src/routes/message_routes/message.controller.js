const MessageModel = require('../../models/message');
const ChatModel = require('../../models/chat');

const sendMessage = async (req, res) => {
    const { text, image, file, audio, video, location, sent, receive, pending, read, senderId, receiverId, flag } = req.body;
    let userIds = [senderId, receiverId];
    let chatId;

    try {
        const chat = await ChatModel.findOne({
            users: { $all: userIds },
            type: "private"
        });

        if (chat) {
            chatId = chat._id;
        } else {
            const newChat = await ChatModel.create({
                users: userIds,
                latestMessage: text
            });
            chatId = newChat._id;
        }

        const existingMessage = await MessageModel.findOne({
           flag
        });

        if (existingMessage) {
            return res.status(200).json({ status:true, message: "Existing Message" });
        } else {
            const newMessage = await MessageModel.create({
                text,
                image,
                file,
                audio,
                video,
                location,
                sent,
                receive,
                pending,
                read,
                senderId,
                receiverId,
                chatId,
                flag
            });

            const chatUpdate = await ChatModel.findByIdAndUpdate(chatId, {
                latestMessage: text
            }, {
                new: true
            });

            await newMessage.populate('senderId receiverId', 'userName profileImage _id');
            return res.send({
                data: newMessage,
                message: "Message sent successfully",
                status: true,
            });
        }
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};

const myMessages = async (req, res) => {
    const chatId = req.query.chatId
    const receiverOne = req.query.receiverOne;
    const receiverTwo = req.query.receiverTwo;
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit 
    try {
        const messages = await MessageModel.find({
            chatId: chatId
        }).populate({
            path: "senderId receiverId",
            select:"userName profileImage _id"
        }).sort({createdAt: -1}).skip(skip).limit(limit)
        res.send({
            data: messages,
            status: true,
        })

         if (receiverOne) {
            messages = await Promise.all(messages.map(async (message) => {
                message.receiverone = receiverOne;
                await message.save();
                return message;
            }));
         }

         if (receiverTwo) {
            messages = await Promise.all(messages.map(async (message) => {
                message.receivertwo = receiverTwo;
                await message.save();
                return message;
            }));
         }

    } catch (error) {
        res.status(403).json({ status: false, error: error })
    }
}

module.exports = {
    sendMessage,
    myMessages
}
