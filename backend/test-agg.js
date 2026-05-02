const mongoose = require('mongoose');
const Task = require('./models/Task');
const User = require('./models/User');
mongoose.connect('mongodb+srv://Task_auth:Hamid2003@authcluster.ubtilol.mongodb.net/authDB?retryWrites=true&w=majority&appName=AuthCluster')
  .then(async () => {
    try {
      const tasks = await Task.find({}).lean();
      console.log('Total tasks:', tasks.length);
      console.log('Sample task assignedTo:', tasks[tasks.length-1].assignedTo);
      
      const users = await User.find({}).lean();
      console.log('Total users:', users.length);
      console.log('Sample user _id:', users[0]._id);
      
      const userStats = await Task.aggregate([
        { $unwind: "$assignedTo" },
        {
          $lookup: {
            from: "users",
            localField: "assignedTo",
            foreignField: "_id",
            as: "userInfo"
          }
        },
        { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } },
        { $limit: 1 }
      ]);
      console.log('Aggregation sample:', JSON.stringify(userStats, null, 2));
      
    } catch (e) {
      console.error(e);
    }
    process.exit();
  });
