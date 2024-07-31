const express=require('express')
const app=express()
const mongoose=require('mongoose')
const User=require('./models/User')
const jwt=require('jsonwebtoken')
const cors=require('cors')
const cookieParser=require('cookie-parser')
const bcrypt=require('bcryptjs')
const bcryptSalt=bcrypt.genSaltSync(10)
const ws=require('ws')
const Message=require('./models/Message')
const fs = require ('fs');


app.use (
  cors ({
    origin: 'https://chat-app-fontend.vercel.app',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: 'Authorization, token, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  })
);

app.use('/uploads',express.static(__dirname+'/uploads'))
app.use(express.json())
app.use(cookieParser())


const dotenv=require('dotenv')
dotenv.config()
mongoose
  .connect (process.env.MONGO_URL)
  .then (res => {
    console.log ('Db connect');
  })
  .catch (err => {
    console.log ('Error', err);
  });

const jwtSecret=process.env.JWT_SECRET
let connectionClosed=false

async function getUserDataFromRequest(req){
    return new Promise((resolve,reject)=>{
        console.log ('req cookie headers is:', req.cookies);
        const token=req.cookies?.token;
        console.log ('token headers is:', token);
        
        if(token){
            jwt.verify(token,jwtSecret,{},(err,userData)=>{
                if(err)throw err;
                const {id,username}=userData
                resolve(userData)
            })
        }else{
            reject('no token')
        }
    } )
}

app.get('/test',(req,res)=>{
    res.json('test ok')
})
app.get('/messages/:userId',async(req,res)=>{
    const {userId}=req.params
        const userData=await getUserDataFromRequest(req)
        const ourUserId=userData.userId
        const messages=await Message.find({
            sender:{$in:[userId,ourUserId]},
            recipient:{$in:[userId,ourUserId]}
        }).sort({createdAt:1})
res.json (messages);


})
app.get('/people',async(req,res)=>{
    const users=await User.find({},{'_id':1,username:1})
    res.json(users)

})
app.get('/profile',(req,res)=>{
    const token=req.cookies?.token;
    if(token){
        jwt.verify(token,jwtSecret,{},(err,userData)=>{
            if(err)throw err;
            const {id,username}=userData
            res.json(userData)
        })
    }else{
        res.json('no token')
    }
    
})
app.post('/login',async(req,res)=>{
    const {username,password}=req.body
    const foundUser=await User.findOne({username})
    if(foundUser){
        const passOk=bcrypt.compareSync(password,foundUser.password)
        if(passOk){
            jwt.sign({
                userId:foundUser._id,
                username
            },jwtSecret,(err,token)=>{
                console.log('In login token is:',token)
                if(err){
                    console.log('error is:',err)
                }
                res.cookie('token',token,{sameSite:'none',secure:true,httpOnly: true}).json({
                    id:foundUser._id,
                })
            })
        }
    }
})
app.post('/logout',(req,res)=>{
    res.cookie('token','',{sameSite:'none',secure:true}).json('ok')
})
app.post('/register',async(req,res)=>{
    const {username,password}=req.body;
    try{
        const hashedPassword=bcrypt.hashSync(password,bcryptSalt)
        const createdUser=await User.create({username,password:hashedPassword});
        jwt.sign({
            userId:createdUser._id,
            username
        },jwtSecret,{},(err,token)=>{
            if(err)throw err;
            res.cookie('token',token,{sameSite:'none',secure:true}).status(201).json({
                id:createdUser._id,
                username
            })
        })

    }catch(err){
        if(err)throw err
    }
})
const PORT = process.env.PORT || 4000;
const server=app.listen(PORT,()=>{
    console.log('Server is running at port 4000')
})

const wss=new ws.WebSocketServer({server})
const clients = new Map ();

wss.on('connection',(connection,req)=>{
    console.log('in connection')

    function notifyAboutOnlinePeople(){
        [...wss.clients].filter(client=>{return (client.userId && client.username)}).forEach (client => {
        client.send (
            JSON.stringify ({
            online: [...wss.clients].filter(c=>c.userId && c.username).map (c => ({
                    userId: c.userId,
                    username: c.username,
            })),
            })
        );
        });
        // console.log('In notify function')
        const listOnline=[...wss.clients].map(c=>({
            username:c.username
        }))
        console.log("List of online user is:")
        console.log(listOnline)

    }
    // connection.isAlive=true
    // connection.timer=setInterval(()=>{
    //     // console.log(connection.username)
    //     connection.ping();
    //     connection.deathTimer=setTimeout(()=>{
    //         connection.isAlive=false
    //         connection.terminate()
    //         // console.log("notify through timer")
    //         notifyAboutOnlinePeople()
    //         clearInterval(connection.timer)
    //         // console.log('dead')
    //     },1000)

    // },5000)
    connection.isAlive = true;

    const interval = setInterval (() => {
        // console.log('connection alive:',connection.isAlive)
        if (!connection.isAlive) {
            console.log('In terminating')
            clearInterval (interval);
            connection.terminate ();
            notifyAboutOnlinePeople()
            return;
        }
    // console.log('In pinging')
        connection.isAlive = false;
        connection.ping ();
    }, 5000);

    connection.on ('pong', () => {
        // console.log('In pong:',connection.username)
        connection.isAlive = true;
    });

    // console.log('timer:',interval)
    // connection.on('pong',()=>{
    //     console.log('pong:',connection.username)
    //     clearTimeout(connection.deathTimer)
    // })
    // console.log(req.headers)

    const cookies=req.headers.cookie;
    let token=null
    if(cookies){
        const tokenCookieString=cookies.split(';').find(str=>str.startsWith('token='))
        if(tokenCookieString){
            token=tokenCookieString.split('=')[1]
            if(token){
                jwt.verify(token,jwtSecret,{},(err,userData)=>{
                    if(err)throw err
                    // console.log(userData)
                    const {userId,username}=userData;
                    connection.userId=userId;
                    connection.username=username
                    if (clients.has(userId)) {
                        clients.get(userId).terminate ();
                    }
                    clients.set (userId, connection);

                })
                notifyAboutOnlinePeople ();
            }
        }
    }
    connection.on('message',async (message)=>{
        const messageData=JSON.parse(message.toString())
        console.log(messageData)
        const {recipient,text,file}=messageData.message
        let filename=null
        if(file){
            const parts=file.name.split('.')
            const extension=parts[parts.length-1];
            filename=Date.now()+'.'+extension
            const path=__dirname + '/uploads/' + filename
            const bufferData=new Buffer(file.data.split(',')[1],'base64')
            fs.writeFile(path,bufferData,()=>{
                console.log('file saved:'+path)
            })
        }
        if(recipient && (text||file)){
            const messageDoc=await Message.create({
                sender:connection.userId,
                recipient,
                text,
                file:file?filename:null
            });

            [...wss.clients].filter(c=>c.userId==recipient).forEach(c=>c.send(JSON.stringify({text,sender:connection.userId,recipient,file:file?filename:null,_id:messageDoc._id})))
        }
    });
    // console.log("notify through direct")
    // if(token)
    connection.on('close',()=>{
        console.log('in close connection')
        console.log(connection.username)
        connection.terminate()
         notifyAboutOnlinePeople()
        // console.log(interval)
    })
    
    
})
