if (process.env.NODE_ENV !== "production") {
    require('dotenv').config()
}
console.log(process.env.SECRET)


const express = require('express')
const app = express();
const mongoose = require('mongoose')
const methodOverride = require('method-override')
const path = require('path')
const ejsMate = require('ejs-mate')
const Celeb = require('./models/main')
const Comment = require('./models/comment');
const User = require('./models/user');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');
const flash = require('connect-flash');
const multer = require('multer');
const { storage } = require('./cloudinary');
const { findById } = require('./models/comment');
const upload = multer({ storage });
const axios  = require("axios");
const morgan = require('morgan')


mongoose.connect('mongodb://localhost:27017/project-1', { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
    .then(() => {
        console.log("Connected to Mongoose!!");
    })
    .catch(err => {
        console.log('Got Error !!!!!');
        console.log(err);
    })

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))
app.use(express.static(path.join(__dirname, 'public')))


app.engine('ejs', ejsMate)
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(morgan('tiny'));

app.get('/home', (req, res) => {
    res.send('Home Directory')
})


const sessionConfig = {
    secret: "Thisshouldbemysecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 1000 * 1 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 1 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));
app.use(flash());


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})



const isLogged = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }
    next()
}

app.get('/celeb', async (req, res) => {
    const celeb = await Celeb.find({}).populate('user').populate('likes').sort({likes: -1}).exec();
    res.render('index', { celeb })
})
app.get('/celeb/new', isLogged, (req, res) => {
    res.render('new')
})

app.post('/celeb', isLogged, upload.single('image'), async (req, res) => {
    const celeb = new Celeb(req.body.celeb);
    const { filename, path } = req.file;
    celeb.image = path;
    celeb.user = req.user._id;
    await celeb.save();
    res.redirect('/celeb')
})

app.get('/celeb/:id', async (req, res) => {
    const { id } = req.params;
    const celeb = await Celeb.findById(id).populate({
        path: 'comments',
        populate: {
            path: 'user'
        }
    }).populate('user');
    res.render('show', { celeb })
})
app.post('/celeb/:id/comments', isLogged, async (req, res) => {
    const { id } = req.params;
    const celeb = await Celeb.findById(id)
    const comment = new Comment(req.body.celeb);
    comment.user = req.user._id;
    celeb.comments.push(comment);
    await comment.save();
    await celeb.save();
    res.redirect(`/celeb/${id}`)
})
app.delete('/celeb/:id', isLogged, async (req, res) => {
    const { id } = req.params;
    const celeb = await Celeb.findOneAndDelete(id);
    res.redirect('/celeb')
})
app.get('/celeb/:id/like', isLogged, async (req,res) => {
    const {id} = req.params;
    const user = await Celeb.findById(id);
    const userId = req.user._id;

    if(!user.likes.includes(userId)){
        user.likes.push(userId);
        await user.save();
             res.send({
        totalLikes : user.likes.length
       })
    }else {
        let idx = user.likes.indexOf(userId);
        user.likes.splice(idx, 1);
        await user.save();
             res.send({
        totalLikes : user.likes.length
       })
    }
    // const liked = user.likes.some(function(like){
    //     return like.equals(userId);
    // })
    // if(liked){
    //    await user.likes.pull(userId);
    //    res.send({
    //     totalLikes : user.likes.length
    //    })
    // } else {
    //    await user.likes.push(req.user._id);
    //    res.send({
    //    totalLikes : user.likes.length
    //    })
    // }
    // await user.save();
    res.redirect('/celeb')
})
app.get('/register', (req, res) => {
    res.render('users/register')
})
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    const user = new User({ username, email });
    const encUser = await User.register(user, password);
    await encUser.save();
    res.redirect('/celeb')
})
app.get('/login', (req, res) => {
    res.render('users/login')
})
app.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), (req, res) => {
    res.redirect('/celeb')
})
app.post('/celeb/:id/comments/:commentId', async (req, res) => {
    const { id } = req.params;
    const { commentId } = req.params;
    const comment = await Comment.findByIdAndDelete(commentId);
    res.redirect(`/celeb/${id}`)
})
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login')
})

app.get('*', (req,res) => {
    res.status(404).send("page not found")
})
app.listen(3000, (req, res) => {
    console.log("Serving On Port 3000");
})

