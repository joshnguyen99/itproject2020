const Portfolio = require("../models/portfolio.model");
const emailBot = require("../emailbot/email");
const Page = require("../models/page.model");
const Artifact = require("../models/artifact.model");
const Media = require("../models/media.model");
const User = require("../models/user.model");
const { use } = require("passport");

// Return an array of all portfolios on the server
const getAllPortfolios = async (_req, res) => {
  try {
    const portfolios = await Portfolio.find();

    let detailedPortfolios = [];
    // no await map :(
    for (let portfolio of portfolios) {
      const p = portfolio.toObject();
      const user = await User.findOne({ username: p.username });
      if (!user) throw Error(`User ${username} not found.`);

      // Add a few more details to the returned portfolio
      p.firstName = user.local.firstName;
      p.lastName = user.local.lastName;
      p.avatar = user.avatar;
      detailedPortfolios.push(p);
    }

    res.status(200).send(detailedPortfolios);
  } catch (err) {
    res.status(404).json(err);
  }
};

// Add a new portfolio to the database
const createPortfolio = async (req, res) => {
  try {
    if (req.user && req.user.username) {
      const username = req.user.username;
      const bio = req.body.bio;
      const theme = req.body.theme;
      const font = req.body.font;
      const colour = req.body.colour;
      const singlePage = req.body.singlePage;
      const social = req.body.social;
      const header = req.body.header;
      const avatar = req.user.avatar;
      const newPortfolio = new Portfolio({
        username,
        bio,
        theme,
        font,
        colour,
        singlePage,
        social,
        header,
        avatar,
      });
      const returnedPortfolio = newPortfolio.toObject();
      if (returnedPortfolio.header) {
        headerObject = await Media.findById(returnedPortfolio.header);
        returnedPortfolio.header = headerObject.url;
      }
      returnedPortfolio.pages = [];
      await newPortfolio.save();
      if (req.user.local && req.user.local.email) {
        emailBot.sendPortfolioAddNotification(req.user.local.email, req.user);
      }
      res.status(200).send(returnedPortfolio);
    } else {
      throw Error("User unidentified.");
    }
  } catch (err) {
    if (err.code == 11000) {
      res.status(400).json("Portfolio of this user already exists!");
    } else if (err.message) {
      res.status(400).json(err.message);
    } else {
      res.status(400).json(err);
    }
  }
};

const createDefaultPortfolio = async (req, res) => {
  try {
    if (req.user && req.user.username) {
      const username = req.user.username;
      const newPortfolio = new Portfolio({ username });
      const aboutPage = new Page({
        username,
        portfolioId: newPortfolio._id,
        name: "About",
        type: "display",
      });
      const educationpage = new Page({
        username,
        portfolioId: newPortfolio._id,
        name: "Education",
        type: "education",
      });
      const experiencePage = new Page({
        username,
        portfolioId: newPortfolio._id,
        name: "Experience",
        type: "experience",
      });
      await aboutPage.save();
      await educationpage.save();
      await experiencePage.save();

      const returnedPortfolio = newPortfolio.toObject();
      returnedPortfolio.pages = [aboutPage, educationpage, experiencePage].map(
        p => {
          return {
            pageId: p._id,
            name: p.name,
          };
        }
      );
      returnedPortfolio.firstName = req.user.local.firstName;
      returnedPortfolio.lastName = req.user.local.lastName;
      returnedPortfolio.email = req.user.local.email;
      await newPortfolio.save();
      if (req.user.local && req.user.local.email) {
        emailBot.sendPortfolioAddNotification(req.user.local.email, req.user);
      }
      res.status(200).send(returnedPortfolio);
    } else {
      throw Error("User unidentified.");
    }
  } catch (err) {
    if (err.code == 11000) {
      res.status(400).json("Portfolio of this user already exists!");
    } else if (err.message) {
      res.status(400).json(err.message);
    } else {
      res.status(400).json(err);
    }
  }
};

const findPortfolio = async username => {
  const portfolio = await Portfolio.findByUsername(username);
  if (!portfolio) throw Error(`Portfolio for the user ${username} not found.`);
  const p = portfolio.toObject();
  const contents = await Portfolio.findAllPages(username);
  p.pages = contents || [];
  const user = await User.findOne({ username });
  if (!user) throw Error(`User ${username} not found.`);

  // Add a few more details to the returned portfolio
  p.firstName = user.local.firstName;
  p.lastName = user.local.lastName;
  p.email = user.local.email;
  p.avatar = user.avatar;
  p.allowContact = user.allowContact;
  return p;
};

// Find a portfolio given its owner's username
const findPortfolioByUsername = async (req, res) => {
  try {
    if (!req.params.username) {
      throw Error("User not found!");
    }
    const username = req.params.username;
    const portfolio = await findPortfolio(username);
    if (portfolio.header) {
      header = await Media.findById(portfolio.header);
      portfolio.header = header.url;
    }
    res.status(200).json(portfolio);
  } catch (err) {
    res
      .status(404)
      .json(`Portfolio for the username ${req.params.username} not found.`);
  }
};

// Change a portfolio's details
const changePortfolio = async (req, res) => {
  try {
    if (!req.user) {
      throw Error("User not found!");
    }
    const username = req.user.username;
    const portfolio = await Portfolio.findByUsername(username);
    const { bio, theme, font, colour, singlePage, social, header } = req.body;
    portfolio.bio = bio ? bio : portfolio.bio;
    portfolio.theme = theme ? theme : portfolio.theme;
    portfolio.font = font ? font : portfolio.font;
    portfolio.colour = colour ? colour : portfolio.colour;
    portfolio.singlePage = singlePage ? singlePage : portfolio.singlePage;
    portfolio.social = social ? social : portfolio.social;
    portfolio.header = header ? header : portfolio.header;
    let changeItems = [];
    if (portfolio.isModified("bio")) changeItems = changeItems.concat("Bio");
    if (portfolio.isModified("social"))
      changeItems = changeItems.concat("social");
    if (portfolio.isModified("theme"))
      changeItems = changeItems.concat("Theme");
    if (portfolio.isModified("singlePage"))
      changeItems = changeItems.concat("singlePage");
    if (req.user.local && req.user.local.email) {
      emailBot.sendPortfolioChangeNotification(
        req.user.local.email,
        req.user,
        changeItems
      );
    }
    await portfolio.save();
    if (!portfolio) {
      throw Error("Portfolio not found!");
    }
    pObject = portfolio.toObject();
    if (header) {
      headerObject = await Media.findById(header);
      pObject.header = headerObject.url;
    }
    res.status(200).send(pObject);
  } catch (err) {
    res.status(400).json(err.message);
  }
};

// Delete a portfolio (requires password authentication first)
const deletePortfolio = async (req, res) => {
  try {
    await Artifact.deleteMany({
      username: req.user.username,
    });
    await Page.deleteMany({
      username: req.user.username,
    });
    await Portfolio.deleteOne({
      username: req.user.username,
    });
    res
      .status(200)
      .json(`Portfolio of user ${req.user.username} successfully deleted.`);
  } catch (err) {
    res.status(400).json(err.message ? err.message : err);
  }
};

// Get all details about a portfolio (incl. its pages, artifacts and media)
const findAllDetails = async (req, res) => {
  try {
    if (!req.params.username) {
      throw Error("User not found!");
    }
    const username = req.params.username;
    const portfolio = await findPortfolio(username);

    let pages = await Page.findByUsername(username);
    pages = pages ? pages : [];
    let artifacts = await Artifact.findByUsername(username);
    artifacts = artifacts ? artifacts : [];
    let aObjects = [];
    for (let i = 0; i < artifacts.length; i++) {
      artifact = artifacts[i];
      const aObject = artifact.toObject();
      let media = [];
      for (let i = 0; i < aObject.media.length; i++) {
        const detailedMedia = await Media.findById(aObject.media[i]);
        if (!detailedMedia) {
          continue;
        }
        media.push(detailedMedia.toObject());
      }
      aObject.media = media;
      aObjects.push(aObject);
    }
    header = null;
    if (portfolio.header) {
      header = await Media.findById(portfolio.header);
      header = header.url;
      portfolio.header = header;
    }
    res.status(200).send({
      portfolio,
      pages: pages.map(p => {
        const pObject = p.toObject();
        pObject.artifacts = aObjects
          .filter(a => a.pageId == pObject.id)
          .map(a => a.id);
        return pObject;
      }),
      artifacts: aObjects,
    });
  } catch (err) {
    res.status(400).json(err.message ? err.message : err);
  }
};

module.exports = {
  createPortfolio,
  findPortfolioByUsername,
  deletePortfolio,
  getAllPortfolios,
  changePortfolio,
  findAllDetails,
  createDefaultPortfolio,
};
