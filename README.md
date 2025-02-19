### This repo is shared with Nirat for AI Experimentation


<a id="readme-top"></a>

<!-- PROJECT LOGO -->
<br/>
<div align="center">
  <div>
    <a href="https://abcddev.think201.xyz/">
      <img src="/deploy/public/logo.jpg" alt="Logo" width="400">
    </a>
  </div>

  <h1 align="center">ABCD</h1>

  <p>
    ABCD seeks to make it easy for impact organizations to run high-quality behavior change programs that get to desired impact
  </p>

  <p align="center">
    <a href="https://3.basecamp.com/5668705/projects/34118276"><strong>Explore the docs »</strong></a>
    <br />
    <a href="https://abcddev.think201.xyz/">Staging link</a>
    ·
    <a href="https://github.com/Think201-ABCD/bug-repo/issues">Bug repo</a>
    ·
    <a href="https://github.com/orgs/Think201-ABCD/projects">Task list</a>
  </p>
</div>

### Technologies Used

-   [![NOdeJS][NodeJS]][NodeJS-url]
-   [![PostgreSQL][PostgreSQL]][PostgreSQL-url]
-   [![TypeScript][TypeScript]][TypeScript-url]
-   [![Redis][Redis]][Redis-url]
-   [![Sequelize][Sequelize]][Sequelize-url]




<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->

## Getting Started

Follow the below steps to get the project started.

### Prerequisites
Here is what you need to be able to run the project:
- Node.js (Version: >=14.x)
- Redis (Version: >=4.x)
- NPM (recommended)

<br/>

### Installation

1. Clone the repo
    ```sh
   https://github.com/Think201-ABCD/abcd-monorepo-backend.git
    ```
2. Install NPM packages
    ```sh
    npm install
    ```
3. Create a `.env` file in the root directory.

4. Add the environment variables listed in the [`env.sample`](https://github.com/Think201-ABCD/abcd-monorepo-backend/blob/staging/env.sample) file

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Run the project

1. Point to the `app.ts` file
    ```sh
    cd Apps/user-service/
    ```
2. Run the project using:
    ```sh
    npm run dev
    ```

<br/>

### Documents
- [Design Documents](https://www.figma.com/design/IExuh8lJt2rnc3qS7Kykq2/Web-App)


[NodeJS]: https://img.shields.io/badge/NodeJS-5FA04E?style=for-the-badge&logo=nodedotjs&logoColor=white&labelColor=%235FA04E&color=%235FA04E
[NodeJS-url]: https://nodejs.org/en

[PostgreSQL]: https://img.shields.io/badge/postgresql-4169e1?style=for-the-badge&logo=postgresql&logoColor=white
[PostgreSQL-url]: https://www.postgresql.org/

[TypeScript]: https://shields.io/badge/TypeScript-3178C6?logo=TypeScript&logoColor=FFF&style=for-the-badge
[TypeScript-url]: https://www.typescriptlang.org/

[Redis]: https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white
[Redis-url]: https://redis.io/

[Sequelize]: https://img.shields.io/badge/-Sequelize-52B0E7?style=for-the-badge&logo=sequelize&labelColor=52B0E7&logoColor=FFF
[Sequelize-url]: https://sequelize.org/
