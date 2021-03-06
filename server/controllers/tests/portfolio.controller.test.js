const mongoose = require("mongoose");
const httpMocks = require("node-mocks-http");
const path = require("path");
const portfolioController = require("../portfolio.controller");
const userController = require("../user.controller");
jest.setTimeout(10000);

require("dotenv").config({
  path: path.resolve(__dirname, "../../../.env"),
});

const options = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
};

// First, set up a connection to the database
beforeAll(async () => {
  const MONGODB_URI = process.env.MONGODB_URI;
  await mongoose.connect(MONGODB_URI, options, err => {
    if (err) console.error(err);
  });
});

// Finally, disconnect the database
afterAll(async () => {
  await mongoose.disconnect();
});

describe("Portfolio Controller - Create a Portfolio", () => {
  it("Successfully create a new portfolio", async () => {
    req = httpMocks.createRequest({
      method: "POST",
      body: {
        firstName: "James",
        middleName: "Kimberly",
        lastName: "Corden",
        username: "jamescorden2",
        email: "jamescorden@latelateshow.com",
        password: "jamescorden",
      },
    });
    let username;
    res = httpMocks.createResponse(req);
    await userController.createUser(req, res).then(async () => {
      let body = await res._getData();
      username = body.username;
    });

    req = httpMocks.createRequest({
      method: "POST",
      user: {
        username: "jamescorden2",
        password: "jamescorden",
      },
      body: {
        bio: "Sample bio of James Corden",
        theme: "Sample theme for James Corden",
      },
    });
    res = httpMocks.createResponse(req);
    await portfolioController.createPortfolio(req, res).then(async () => {
      let body = await res._getData();
      expect(res.statusCode).toBe(200);
      expect(body).toHaveProperty("username");
      expect(body).toHaveProperty("theme");
      expect(body).toHaveProperty("bio");
      expect(body).toHaveProperty("pages");

      expect(body.theme).toBe("Sample theme for James Corden");
      expect(body.username).toBe("jamescorden2");
      expect(body.bio).toBe("Sample bio of James Corden");
      expect(body.pages.length).toBe(0);

      expect(body).not.toHaveProperty("__v");
      expect(body).not.toHaveProperty("_id");
    });

    req = httpMocks.createRequest({
      method: "DELETE",
      body: {
        firstName: "James",
        middleName: "Kimberly",
        lastName: "Corden",
        username: "jamescorden2",
        email: "jamescorden@latelateshow.com",
        password: "jamescorden",
      },
    });
    res = httpMocks.createResponse(req);
    await userController.deleteUser(req, res);
  });

  it("Fail to create a new portfolio - portfolio already exists for user", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      user: {
        username: "jamescorden2",
        password: "jamescorden",
      },
      body: {
        bio: "Sample bio of James Corden",
        theme: "Sample theme for James Corden",
      },
    });
    const res = httpMocks.createResponse(req);
    await portfolioController.createPortfolio(req, res).then(async () => {
      const body = await res._getData();
      expect(res.statusCode).toBe(400);
      expect(body).toBe('"Portfolio of this user already exists!"');
    });
  });
});

describe("Portfolio Controller - Create new portfolio", () => {
  it("Successfully create a new portfolio", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
      params: {
        username: "jamescorden2",
      },
    });
    const res = httpMocks.createResponse(req);
    await portfolioController.findAllDetails(req, res).then(async () => {
      const body = await res._getData();
      expect(res.statusCode).toBe(200);
      expect(body).toHaveProperty("portfolio");
      expect(body).toHaveProperty("pages");
      expect(body).toHaveProperty("artifacts");
    });
  });
});

describe("Portfolio Controller - Change the details of a portfolio", () => {
  it("Successfully create a new portfolio", async () => {
    const req = httpMocks.createRequest({
      method: "PATCH",
      params: {
        username: "jamescorden2",
      },
      user: {
        username: "jamescorden2",
        password: "jamescorden",
      },
      body: {
        bio: "new bio",
        theme: "new theme",
      },
    });
    const res = httpMocks.createResponse(req);
    await portfolioController.changePortfolio(req, res).then(async () => {
      const body = await res._getData();
      // console.log(body);
      expect(res.statusCode).toBe(200);
      expect(body).toHaveProperty("theme");
      expect(body).toHaveProperty("username");
      expect(body).toHaveProperty("bio");

      expect(body.theme).toBe("new theme");
      expect(body.bio).toBe("new bio");
    });
  });
});

describe("Portfolio Controller - Delete a Portfolio", () => {
  it("Successfully delete a portfolio", async () => {
    const req = httpMocks.createRequest({
      method: "DELETE",
      user: {
        username: "jamescorden2",
        password: "jamescorden",
      },
    });
    const res = httpMocks.createResponse(req);
    await portfolioController.deletePortfolio(req, res).then(async () => {
      const body = await res._getData();
      expect(res.statusCode).toBe(200);
      expect(body).toBe(
        '"Portfolio of user jamescorden2 successfully deleted."'
      );
    });
  });
});
