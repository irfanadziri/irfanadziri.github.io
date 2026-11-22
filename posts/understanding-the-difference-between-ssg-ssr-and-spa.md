# Understanding the Difference between SSG, SSR, and SPA

> The distinctions between SSG, SSR, and SPA in term of their unique approaches in modern web development.

- Type: Post
- Published: 2024-03-21
- Tags: web-architecture
- Source: https://irfanadziri.dev/posts/understanding-the-difference-between-ssg-ssr-and-spa/

---

The Static Site Generation (SSG), Server-Side Rendering (SSR), and Single Page Applications (SPA) are three popular approaches in building modern websites. Here are brief explanation of what they are.

## Static Site Generation (SSG)

It involves **pre-building web pages during the development time** rather than generating them dynamically on the server as clients make request. This means that the content generated once and served as static files, making the website fast, highly cacheable, and easily scalable. Ideal for **infrequent content changing** websites.

## Server-Side Rendering (SSR)

It involves **generating the HTML of a web page dynamically on the server for each request** and sending it to the client. SSR can handle dynamic content and data fetching during the server-rendering process, allowing the page to be personalized for each request. Ideal for **SEO optimized** websites.

## Single Page Applications (SPA)

It involves **loading a single HTML page initially and then dynamically update the page content as the user interacts** with the application. Most of the rendering and data fetching in SPAs happens on the client-side using JavaScript frameworks. Ideal for **highly interactive** applications.

## Key Differences

|               |        SSG        |        SSR       |        SPA       |
| ------------- | :---------------: | :--------------: | :--------------: |
| Rendering     |    Pre-rendered   | Server Rendering | Client Rendering |
| Use Case      | Blogs, Portfolios | SEO Requirements |   Social Media   |
| Initial Load  |        Fast       | Moderate to Slow | Moderate to Slow |
| Content       |    Can be stale   |    Up-to-date    |    Up-to-date    |
| SEO           |        Good       |     Excellent    |       Poor       |
| Complexity    |        Low        | Moderate to High |       High       |
| Interactivity |      Limited      |      Limited     |       High       |
