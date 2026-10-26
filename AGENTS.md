# PROJECT DESCRIPTION

## This is a single page web application for the kindergarten Magični Svijet in Sarajevo. It includes a public landing page with the classes (programs), a contact form, parent registration and login, a parent dashboard where parents manage their children and enrollment applications, an events feed, and an admin panel. It's a university course project. Keep the project simple and straightforward.

# Stack:
-Frontend: plain html, css, javascript and bootstrap 5. spa hash routing (#/home, #/login...). AJAX (fetch) for all data. 
-Backend: pure php with the flightphp framework. PDO with prepared statements for the database. -Database: mysql -Auth: JWT 
-API docs: openapi / swagger -External API: openweathermap for the "today's sky" weather widget (home page and dashboard sidebar)

# Architecture rules:
-backend and frontend code never get mixed. backend only returns JSON, frontend is just html, css and js. 
-the backend has 3 layers: routes, then services, then dao. routes only handle the http stuff. services have the business logic and validation and are the only ones allowed to call a dao. dao is the only layer that talks to the database. all daos extend a BaseDao. 
-middleware has to be reusable and registered in flightphp, never copy pasted into routes. we need authentication (401 if the token is missing, wrong or expired), authorization by role (403), request logging and error handling. 
-views in the frontend have no AJAX calls inside them. only js/api.js talks to the backend, and the page scripts in js/pages use it. 
-the frontend has a mock api (js/mock-api.js) for milestone 1. switching USE_MOCK_API to false in js/config.js has to be the only change needed to use the real backend. 
-the weather api is only called from the backend (WeatherService), never from the frontend, so the api key stays secret. it needs a timeout, error logging and a friendly fallback message. 
-everything from the api is escaped with Utils.esc() before it goes into html. -never hardcode secrets. db password, jwt secret and api keys go in backend/config/config.local.php which is not committed. config.example.php has to stay up to date with it. 
-never show stack traces, sql queries or file paths in api responses. 
-info log and error log go in backend/logs/info.log and backend/logs/error.log

# Folder structure:
-backend: routes, services, dao, middleware, config, logs -frontend: css, js (with js/pages), views (with views/layouts), assets and index.html 
-database: the .sql file with schema and sample data -docs: AI_LOG.md and the erd image

# Naming:
-php classes are PascalCase and end with their layer, like EnrollmentDao and EnrollmentService. file name is the same as the class name. 
-database tables are snake_case and plural, like enrollments. columns are snake_case too, like date_of_birth. 
-api routes are lowercase and plural, like /children and /programs/{id} -js and view files are lowercase with dashes, like auth-pages.js and not-found.html

# Roles:
admin, parent and teacher

# Git:
One branch per milestone (milestone1 to milestone5). never merge a milestone branch into main.

# How the AI should work with me:
-ask me before installing any new package, library or framework. bootstrap 5 and flightphp are enough for now. -only do the task I asked for. small focused changes are better than rewriting whole files. 
-follow the layers and folders described above. if something doesn't fit, tell me instead of changing the structure on your own. 
-new pages should look like the rest of the site: same pastel colors, Lobster Two and Nunito fonts, rounded cards, bubbles and clouds. 
-use placeholders like [TEACHER NAME] instead of making up real names, prices or contact info. 
-after writing code, give me a short plain explanation of what it does and why, because I need to understand and present every part of the project myself.
