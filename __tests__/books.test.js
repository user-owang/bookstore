process.env.NODE_ENV = "test";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let book_isbn;

beforeEach(async () => {
  let result = await db.query(`
    INSERT INTO
      books (isbn, amazon_url,author,language,pages,publisher,title,year)
      VALUES(
        '123432122',
        'https://amazon.com/taco',
        'Elie',
        'English',
        100,
        'Nothing publishers',
        'my first book', 2008)
      RETURNING isbn`);

  book_isbn = result.rows[0].isbn;
});

afterEach(async function () {
  await db.query("DELETE FROM BOOKS");
});

afterAll(async function () {
  await db.end();
});

describe("POST /books", () => {
  test("Creates a new book", async function () {
    const response = await request(app).post(`/books`).send({
      isbn: "42069420",
      amazon_url: "https://google.com",
      author: "Testy McTestface",
      language: "english",
      pages: 69,
      publisher: "Tester",
      title: "how to be incredibly sick af",
      year: 2024,
    });
    expect(response.statusCode).toBe(201);
    expect(response.body.book).toHaveProperty("isbn");
  });

  test("Prevents creating book without required fields", async function () {
    const response = await request(app).post(`/books`).send({ pages: 69 });
    expect(response.statusCode).toBe(400);
  });
});

describe("GET /", () => {
  test("Get all books", async function () {
    const response = await request(app).get(`/books`);
    const books = response.body.books;
    expect(books).toHaveLength(1);
    expect(books[0]).toHaveProperty("isbn");
    expect(books[0]).toHaveProperty("title");
  });
});

describe("PUT /books/:id", () => {
  test("Update a book in db", async function () {
    const response = await request(app).put(`/books/${book_isbn}`).send({
      isbn: book_isbn,
      amazon_url: "https://google.com",
      author: "Testy McTestface",
      language: "english",
      pages: 69,
      publisher: "Tester",
      title: "how to be incredibly sick af",
      year: 2024,
    });
    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.title).toBe("how to be incredibly sick af");
  });

  test("Error if missing or invalid info", async function () {
    const response = await request(app).put(`/books/${book_isbn}`).send({
      badField: "DO NOT ADD ME!",
    });
    expect(response.statusCode).toBe(400);
  });

  test("404 if book not found", async function () {
    const response = await request(app).put(`/books/00000000`).send({
      isbn: book_isbn,
      amazon_url: "https://google.com",
      author: "Testy McTestface",
      language: "english",
      pages: 69,
      publisher: "Tester",
      title: "how to be incredibly sick af",
      year: 2024,
    });
    expect(response.statusCode).toBe(404);
  });
});

describe("DELETE /books/:id", function () {
  test("Deletes a book", async function () {
    const response = await request(app).delete(`/books/${book_isbn}`);
    expect(response.body).toEqual({ message: "Book deleted" });
  });
});
