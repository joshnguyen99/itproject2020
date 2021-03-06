export const baseURL =
  process.env.REACT_APP_BASE_URL ||
  // || "http://localhost:5000/api";
  "https://camelcase-itproject.herokuapp.com/api";

export const user = "/user";
export const signup = user + "/signup";
export const login = user + "/login";
export const logout = user + "/logout";
export const logoutAll = logout + "/all";

export const avatar = "/avatar";

export const media = "/media";
export const mediaById = id => media + "/" + id;

export const portfolios = "/portfolios";
export const createPortfolio = "/portfolios/default";
export const portfoliosByUsername = username => portfolios + "/" + username;
export const fullPortfolioByUsername = username =>
  portfoliosByUsername(username) + "/all";
export const artifactsByUsername = username =>
  portfoliosByUsername(username) + "/artifacts";
export const pagesByUsername = username =>
  portfoliosByUsername(username) + "/pages";

export const pages = "/pages";
export const pagesById = pageId => pages + "/" + pageId;
export const artifactsByPageId = pageId => pagesById(pageId) + "/artifacts";
export const fullPageById = pageId => pagesById(pageId) + "/all";

export const artifacts = "/artifacts";
export const artifactsById = artifactId => artifacts + "/" + artifactId;

export const contact = "/contact";

export const resetPassword = "/resetpassword";
export const resetPasswordStep = i => resetPassword + "/Step" + i;
