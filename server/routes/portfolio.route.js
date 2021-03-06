// Router for portfolio
// Operators: CRUD (Create, Read, Update, Delete)

// Create a new router
const router = require("express").Router();

const portfolioController = require("../controllers/portfolio.controller");

const userMiddleware = require("../middleware/authentication.middleware");
const pageController = require("../controllers/page.controller");
const artifactController = require("../controllers/artifact.controller");

router.post(
  "/",
  userMiddleware.authenticateToken,
  portfolioController.createPortfolio
);

router.post(
  "/default",
  userMiddleware.authenticateToken,
  portfolioController.createDefaultPortfolio
);

router.get("/", portfolioController.getAllPortfolios);

router.get("/:username/all", portfolioController.findAllDetails);

router.get("/:username/pages", pageController.findPagesByUsername);

router.get("/:username/artifacts", artifactController.findArtifactsByUsername);

router.get("/:username", portfolioController.findPortfolioByUsername);

router.patch(
  "/:username",
  userMiddleware.authenticateToken,
  portfolioController.changePortfolio
);

router.post(
  "/:username/pages",
  userMiddleware.authenticateToken,
  pageController.createPage
);

router.delete(
  "/:username",
  userMiddleware.authenticatePassword,
  portfolioController.deletePortfolio
);

module.exports = router;
