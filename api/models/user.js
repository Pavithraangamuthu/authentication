const mongoose=require('mongoose');
const userSchema=mongoose.Schema({
    _id:mongoose.Schema.Types.ObjectId,
    emailid:{type: String,required: true,unique:true,
        match:/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/},
    password:{type: String,required: true }
    
});

module.exports=mongoose.model('User',userSchema);

const tokenSchema=mongoose.Schema({
    _id:mongoose.Schema.Types.ObjectId,
    token:String,
    status:String
});
module.exports=mongoose.model('Token',tokenSchema);