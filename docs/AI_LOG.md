## Milestone 1
**AI Tools Used:** Claude

**How AI Was Used:**
1. **Website Design:** Described the kindergarten app, custom color palette, and the "cosmic storybook" concept. The AI outlined how the website should look, creating mockups for the landing page, login view, and parent dashboard, and incorporating the website's logo.
2. **Template Integration:** Asked the AI to combine the custom design concept with a Bootstrap template while retaining the custom pastel color scheme instead of the template's default colors.
3. **Frontend Code Generation:** Asked the AI to write the initial frontend code for the project folder structure. It created the single-page application (SPA) structure using HTML, CSS, JavaScript, and Bootstrap.


## Milestone 2
**AI Tools Used:** Claude

**How AI Was Used:**
1. **Database and DAO code.** The AI generated the first version of the SQL schema with sample data and the DAO classes, based on the ERD I made in milestone 1. I imported the database in phpMyAdmin myself, checked the tables and foreign keys in the Designer view, and went through the DAO methods to make sure I understand every query.


## Milestone 3
**AI Tools Used:** Claude

**How AI Was Used:**
1. **Service Layer:**  Generated initial service drafts per entity to speed up repetitive validation checks (required fields, email format, non-future birth dates, min_age vs. max_age, and child-to-program age matching), then reviewed and wired them as the sole layer interacting with the DAOs.
2. **Routes:** Wrote the FlightPHP routes for all five entities (GET, POST, PUT, DELETE) and an error handler that returns JSON with the right status code.
3. **Swagger:** Helped generate initial openapi.yaml definitions and a backend/swagger/index.html setup, which were adjusted to match the actual routes and payloads.
4. **External API:** Wrote a WeatherService that calls OpenWeatherMap with a timeout, logs errors to logs/error.log and returns a friendly message when the API fails. The API key was generated personally and kept strictly in config.local.php.
