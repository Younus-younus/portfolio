import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import ejsMate from 'ejs-mate';
import methodOverride from 'method-override';
import { v4 as uuidv4 } from 'uuid';
import flash from 'connect-flash';
import passport from 'passport';
import bcrypt from 'bcrypt';
import session from 'express-session';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import { initialize } from './passport-config.js'; // Ensure this module is implemented correctly
import { saveUrl, isLoggedIn, isOwner } from './views/middleware.js';

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

const sessionData = JSON.stringify({
  cookie: {
    originalMaxAge: 2592000000, // 30 days in ms
    expires: new Date(Date.now() + 2592000000).toISOString(),
    secure: false,
    httpOnly: true,
    path: "/",
  },
  flash: {},
});

const sessionId = String(uuidv4());

await prisma.session.create({
  data: {
    sid: sessionId,
    expiresAt: new Date("2024-12-31T08:50:27.617Z"),
    data: JSON.stringify({
      cookie: {
        originalMaxAge: 2592000000,
        expires: "2024-12-31T08:50:27.617Z",
        secure: false,
        httpOnly: true,
        path: "/"
      },
      passport: {
        user: "1754d20b-48c2-4fed-82fb-baa698c1b993"
      }
    })
  }
});


// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// Initialize Express
const app = express();

// Set up view engine and middlewares
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(morgan('dev'));

// Session management
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, // How often to check for expired sessions
      dbRecordId: "sid",
      dbRecordData: "sessionData",
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 2592000000, // 30 days
    },
  })
);



// Flash messages and Passport initialization
app.use(flash());
initialize(passport);
app.use(passport.initialize());
app.use(passport.session());
app.use('/uploads', express.static('uploads'));

// Set up locals for views
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.CurrUser = req.user;
  next();
});

// Utility function to generate UUIDs
const generateUUID = () => uuidv4();

// Routes
app.get('/', async (req, res) => {
  try {
    const portfolios = await prisma.portfolio.findMany({
      include: {
        images: { take: 1 }, // Fetch only the first image per portfolio
        _count: { select: { likes: true } }, // Count likes
      },
    });

    const portfolioData = portfolios.map((portfolio) => ({
      ...portfolio,
      image_url: portfolio.images?.[0]?.imageUrl || '/images/placeholder.png', // Default to a placeholder image
      like_count: portfolio._count.likes, // Include like count
      describeYou: portfolio.describeYou,
    }));

    res.render('resumes/homepage', {
      portfolios: portfolioData,
      CurrUser: req.user || null, // Current user
    });
  } catch (error) {
    console.error('Error fetching portfolios:', error.message, error.stack);
    res.status(500).send('Error fetching portfolios.');
  }
});
app.get('/portfolio', async (req, res) => {
  try {
    const portfolios = await prisma.portfolio.findMany({
      include: {
        images: { take: 1 }, // Fetch only the first image per portfolio
        _count: { select: { likes: true } }, // Count likes
      },
    });

    const portfolioData = portfolios.map((portfolio) => ({
      ...portfolio,
      image_url: portfolio.images?.[0]?.imageUrl || '/images/placeholder.png', // Default to a placeholder image
      like_count: portfolio._count.likes, // Include like count
      describeYou: portfolio.describeYou,
    }));

    res.render('resumes/homepage', {
      portfolios: portfolioData,
      CurrUser: req.user || null, // Current user
    });
  } catch (error) {
    console.error('Error fetching portfolios:', error.message, error.stack);
    res.status(500).send('Error fetching portfolios.');
  }
});

app.get('/portfolio/my', isLoggedIn, async (req, res) => {
  try {
    const userId = req.user.id;

    // Query portfolios
    const portfolios = await prisma.portfolio.findMany({
      where: { userId },
      include: {
        images: true,
        likes: true, // Include likes for calculating counts
      },
    });

    // Add like_count property
    const portfoliosWithLikes = portfolios.map((portfolio) => ({
      ...portfolio,
      like_count: portfolio.likes.length, // Count the likes
    }));

    res.render('resumes/myportfolio', { portfolios: portfoliosWithLikes });
  } catch (err) {
    console.error("Error fetching portfolios:", err);
    req.flash("error", "An error occurred while retrieving your portfolios.");
    res.redirect('/');
  }
});



app.get('/portfolio/new', (req, res) => {
  res.render('resumes/new');
});

app.get('/signin', (req, res) => {
  res.render('user/signin');
})
app.get('/login', (req, res) => {
  res.render('user/login')
})


app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        username,
        password: hashedPassword,
      },
    });

    req.flash('success', 'Registration successful!');
    res.redirect('/login');
  } catch (error) {
    console.error('Error during registration:', error);

    if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
      req.flash('error', 'Username already exists.');
    } else {
      req.flash('error', 'Registration failed. Please try again.');
    }
    res.redirect('/login');
  }
});

app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true,
}), async (req, res) => {
  try {
    const sessionData = {
      cookie: req.session.cookie,
      flash: req.flash(), // Assuming you're using flash messages
    };

    await prisma.session.create({
      data: {
        sid: req.sessionID,  // session ID generated by express-session
        expiresAt: new Date(Date.now() + 2592000000), // 30 days from now
        sessionData: JSON.stringify(sessionData), // Store session data as a string
      },
    });

    res.redirect('/');
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).send('Error saving session data');
  }
});



app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash('success', 'Logged out successfully.');
    res.redirect('/');
  });
});
app.get('/portfolio/author', (req, res) => {
  res.render('resumes/authorpage');
})

app.get('/portfolio/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch the main portfolio data
    const portfolio = await prisma.portfolio.findUnique({
      where: { id },
      include: {
        contact: true,
        education: true,
        skills: true,
        interest: true,
        languages: true,
        images: true,
      },
    });

    if (!portfolio) {
      return res.status(404).send('Portfolio not found');
    }

    // Paginated views for related data.
    const images = await prisma.image.findMany({
      where: { portfolioId: id },
      take: 5,
    });

    const contacts = await prisma.contact.findMany({
      where: { portfolioId: id },
      take: 5,
    });

    const educations = await prisma.education.findMany({
      where: { portfolioId: id },
      take: 5,
    });

    const skills = await prisma.skill.findMany({
      where: { portfolioId: id },
      take: 5,
    });

    const languages = await prisma.language.findMany({
      where: { portfolioId: id },
      take: 5,
    });

    const interests = await prisma.interest.findMany({
      where: { portfolioId: id },
      take: 5,
    });

    // Check if the current user has liked the portfolio
    const hasLiked = req.user
      ? await prisma.like.findFirst({
          where: {
            userId: req.user.id,
            portfolioId: id,
          },
        })
      : null;

    res.render('resumes/show', {
      portfolio,
      images, // Paginated query
      contact: contacts,
      education: educations,
      skills,
      interests, // correctly limited
      languages,
      CurrUser: req.user || null,
      hasLiked: !!hasLiked,
    });
  } catch (error) {
    console.error('Error fetching portfolio:', { error, portfolioId: id });
    res.status(500).send(`Error fetching portfolio: ${error.message}`);
  }
});


app.post('/portfolio', upload.single('image'), isLoggedIn, async (req, res) => {
  const {
    name,
    describeYou,
    description,
    contact,
    gmail,
    address,
    course,
    institute,
    skill,
    interest,
    language,
  } = req.body;

  const userId = req.user.id;
  const portfolioId = uuidv4();

  const imageUrl = req.file?.path.replace(/\\/g, '/');
  const imageName = req.file?.filename;

  try {
    // Validate required fields
    if (!name || !description || !contact || !language || !describeYou) {
      req.flash('error', 'Please fill out all required fields.');
      return res.redirect('/portfolio/new');
    }

    // Parse comma-separated inputs
    const skillsArray = skill ? skill.split(',').map((s) => s.trim()) : [];
    const languagesArray = language ? language.split(',').map((lang) => lang.trim()) : [];

    // Create portfolio
    await prisma.portfolio.create({
      data: {
        id: portfolioId,
        name,
        describeYou,
        description,
        user: { connect: { id: userId } }, // Link to user
        contact: {
          create: {
            contact,
            gmail,
            address,
          },
        },
        education: {
          create: {
            course,
            institute,
          },
        },
        skills: { // Ensure your Prisma schema uses `skills` (plural)
          create: skillsArray.map((s) => ({ skill: s })),
        },
        interest: {
          create: {
            interest,
          },
        },
        languages: {
          create: languagesArray.map((lang) => ({ language: lang })),
        },
        images: imageUrl && imageName
          ? {
              create: {
                imageUrl,
                imageName,
                user: { connect: { id: userId } }, // Connect to the user via relation
              },
            }
          : undefined,
      },
    });

    req.flash('success', 'Portfolio created successfully!');
    res.redirect('/');
  } catch (err) {
    console.error('Error creating portfolio:', err.message || err);
    console.error('Prisma Error Details:', err.meta); // Log Prisma-specific details
    req.flash('error', 'An error occurred while creating your portfolio. Please try again.');
    res.render('/portfolio/new');
  }
});


app.post('/portfolio/:id/like', isLoggedIn, async (req, res) => {
  const { id } = req.params; // Portfolio ID
  const userId = req.user.id; // Logged-in user's ID

  try {
    // Check if the user has already liked this portfolio
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_portfolioId: {
          userId,
          portfolioId: id,
        },
      },
    });

    if (existingLike) {
      // If the like exists, remove it (unlike)
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });
      req.flash('success', 'Portfolio unliked!');
    } else {
      // If no like exists, add a new like
      await prisma.like.create({
        data: {
          userId,
          portfolioId: id,
        },
      });
      req.flash('success', 'Portfolio liked!');
    }

    // Redirect back to the portfolio or previous page
    res.redirect('/');
  } catch (err) {
    console.error('Error handling like/unlike:', err);
    req.flash('error', 'An error occurred while processing your like.');
    res.redirect(req.get('Referer') || `/portfolio/${id}`);
  }
});


app.delete("/portfolio/:id", isLoggedIn, isOwner, async (req, res) => {
  const { id: portfolioId } = req.params;

  try {
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: { images: true },
    });

    if (!portfolio) {
      req.flash("error", "Portfolio not found.");
      return res.redirect('/');
    }

    if (portfolio.images && portfolio.images.length > 0) {
      await prisma.image.deleteMany({ where: { portfolioId } });
    }

    await prisma.portfolio.delete({ where: { id: portfolioId } });

    req.flash("success", "Deleted Portfolio Successfully!");

    // Check if it's an API request or full-page request
    if (req.headers["x-requested-with"] === "XMLHttpRequest") {
      return res.status(200).json({ message: "Portfolio deleted successfully!" });
    }

    res.redirect('/');
  } catch (err) {
    console.error("Error deleting portfolio:", err);
    req.flash("error", "An unexpected error occurred.");
    res.redirect('/');
  }
});



app.get('/portfolio/:id/edit', isLoggedIn, isOwner, async (req, res) => {
  const { id: portfolioId } = req.params;

  try {
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        contact: { select: { contact: true, gmail: true, address: true } },
        education: { select: { course: true, institute: true } },
        skills: { select: { skill: true } },
        interest: { select: { interest: true } },
        languages: { select: { language: true } },
        images: { select: { imageUrl: true, imageName: true } },
      },
    });

    if (!portfolio) {
      req.flash('error', 'Portfolio not found.');
      return res.redirect('/portfolio');
    }

    const skills = portfolio.skills.map(skill => skill.skill);
    const languages = portfolio.languages.map(lang => lang.language);

    res.render('resumes/update.ejs', {
      portfolio,
      contact: portfolio.contact || {},
      education: portfolio.education || {},
      skills,
      interests: portfolio.interest || {},
      languages,
      images: portfolio.images || [],
    });
  } catch (err) {
    console.error('Error fetching portfolio and related data:', err);
    req.flash('error', 'Error fetching portfolio and related data.');
    res.status(500).send('Error fetching portfolio and related data');
  }
});



app.put('/portfolio/:id', upload.single('image'), isOwner, isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    describe_you,
    gmail,
    contact,
    address,
    institute,
    course,
    skill,
    interest,
    language,
  } = req.body;

  try {
    // Validate required fields
    if (!name || !description) {
      req.flash('error', 'Name and description are required.');
      return res.redirect(`/portfolio/${id}/edit`);
    }

    const updates = [];

    // Update Portfolio details
    updates.push(
      prisma.portfolio.update({
        where: { id },
        data: { name, description, describeYou: describe_you },
      })
    );

    // Handle image upload
    if (req.file) {
      const imageUrl = req.file.path.replace(/\\/g, '/');
      updates.push(
        prisma.image.upsert({
          where: { portfolioId: id }, // Adjust if this isn't unique
          update: {
            imageUrl,
            imageName: req.file.filename,
          },
          create: {
            portfolioId: id,
            userId: req.user.id,
            imageUrl,
            imageName: req.file.filename,
          },
        })
      );
    }

    // Update Contact details
    if (gmail || contact || address) {
      updates.push(
        prisma.contact.upsert({
          where: { portfolioId: id },
          update: { gmail, contact, address },
          create: { portfolioId: id, gmail, contact, address },
        })
      );
    }

    // Update Education details
    if (institute || course) {
      updates.push(
        prisma.education.upsert({
          where: { portfolioId: id },
          update: { institute, course },
          create: { portfolioId: id, institute, course },
        })
      );
    }

    // Update Skills
    if (skill) {
      const skillArray = skill.split(',').map((s) => s.trim());
      const existingSkills = await prisma.skill.findMany({
        where: { portfolioId: id },
        select: { skill: true },
      });
      const existingSkillSet = new Set(existingSkills.map((s) => s.skill));
      const newSkillSet = new Set(skillArray);

      const toDelete = [...existingSkillSet].filter((s) => !newSkillSet.has(s));
      const toAdd = [...newSkillSet].filter((s) => !existingSkillSet.has(s));

      if (toDelete.length > 0) {
        updates.push(
          prisma.skill.deleteMany({
            where: {
              portfolioId: id,
              skill: { in: toDelete },
            },
          })
        );
      }

      if (toAdd.length > 0) {
        updates.push(
          prisma.skill.createMany({
            data: toAdd.map((s) => ({ portfolioId: id, skill: s })),
            skipDuplicates: true,
          })
        );
      }
    }

    // Update Interests
    if (interest) {
      updates.push(
        prisma.interest.upsert({
          where: { portfolioId: id },
          update: { interest },
          create: { portfolioId: id, interest },
        })
      );
    }

    // Update Languages
    if (language) {
      const languageArray = language.split(',').map((lang) => lang.trim());
      const existingLanguages = await prisma.language.findMany({
        where: { portfolioId: id },
        select: { language: true },
      });
      const existingLangSet = new Set(existingLanguages.map((lang) => lang.language));
      const newLangSet = new Set(languageArray);

      const toDelete = [...existingLangSet].filter((lang) => !newLangSet.has(lang));
      const toAdd = [...newLangSet].filter((lang) => !existingLangSet.has(lang));

      if (toDelete.length > 0) {
        updates.push(
          prisma.language.deleteMany({
            where: {
              portfolioId: id,
              language: { in: toDelete },
            },
          })
        );
      }

      if (toAdd.length > 0) {
        updates.push(
          prisma.language.createMany({
            data: toAdd.map((lang) => ({ portfolioId: id, language: lang })),
            skipDuplicates: true,
          })
        );
      }
    }

    // Execute updates in a transaction
    await prisma.$transaction(updates);

    req.flash('success', 'Portfolio updated successfully!');
    res.redirect(`/portfolio/${id}`);
  } catch (err) {
    console.error('Error updating portfolio:', err);
    req.flash('error', 'An error occurred while updating the portfolio.');
    res.redirect(`/portfolio/${id}/edit`);
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
