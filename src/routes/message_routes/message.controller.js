const MessageModel = require('../../models/message');
const ChatModel = require('../../models/chat');
const UserModel = require('../../models/user');

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

        let existingMessage;

        if (flag) {
           existingMessage = await MessageModel.findOne({ flag });
        }

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
            
            sendNotification(newMessage);
            
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



const sendNotification = async (notificationData) => {
  try {
    let findUser = await UserModel.findById(notificationData?.receiverId);

    if (!!findUser?.fcmToken) {
      if (findUser?.fcmToken.includes("Expo")) {
        let formdata = {
          to: findUser?.fcmToken,
          title: "New Message",
          body: notificationData?.text,
        };

        const raw = JSON.stringify(formdata);
        var requestOptions = {
          mode: "no-cors",
          method: "POST",
          body: raw,
          redirect: "follow",
        };

        fetch("https://exp.host/--/api/v2/push/send", requestOptions)
          .then((response) => response.text())
          .then((result) => {
            console.log("result", JSON.parse(result));
          })
          .catch((error) => console.error(error));
      } else {
        let notificationPayload = {
          roomId: notificationData?.chatId,
          roomName: findUser.userName,
          receiverIds: notificationData?.userId,
          type: notificationData.roomData.type,
        };
        let res = await firebase.messaging().send({
          token: findUser?.fcmToken,
          notification: {
            title: "New Message",
            body: notificationData.text,
          },
          data: {
            notification_type: "chat",
            navigationId: 'messages',
            data: JSON.stringify(notificationPayload),
          },
        });
      }
    }
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};



const myMessages = async (req, res) => {
    const chatId = req.query.chatId;
    const receiverOne = req.query.receiverone;
    const receiverTwo = req.query.receivertwo;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        let messages = await MessageModel.find({ chatId: chatId })
            .populate({
                path: "senderId receiverId",
                select: "userName profileImage _id"
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

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

        res.send({
            data: messages,
            status: true,
        });
    } catch (error) {
        res.status(403).json({ status: false, error: error });
    }
};

module.exports = {
    sendMessage,
    myMessages
}
