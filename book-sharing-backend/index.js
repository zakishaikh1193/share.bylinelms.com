const express = require('express');
const router = express.Router();
const cors = require('cors');
require('dotenv').config();
const app = express();
const auth = require('./controllers/authController');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.set('trust proxy', true);

// Routes
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
const countryRoutes = require('./routes/countryRoutes');
const languageRoutes = require('./routes/languageRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const standardRoutes = require('./routes/standardRoutes');
const booksRoutes = require('./routes/booksRoutes'); 
const bookTypeRoutes = require('./routes/bookTypeRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const logRoutes = require('./routes/logRoutes');
const path = require('path');
const bookFormatRoutes = require('./routes/bookFormatRoutes');
const tagRoutes = require('./routes/tagRoutes');


app.get('/api', (req, res) => res.send('Book Sharing API Running'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/api/login', auth.login);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/countries', countryRoutes);
app.use('/api/standards', standardRoutes);
app.use('/api/languages', languageRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/booktypes', bookTypeRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin/activity-logs', logRoutes);
app.use('/api/book-formats', bookFormatRoutes);
app.use('/api/tags', tagRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));