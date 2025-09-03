using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using System.Data.SqlClient;
using System.IO;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeeController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _env;


        public EmployeeController(IConfiguration configuration, IWebHostEnvironment env)
        {
            _configuration = configuration;
            _env = env;
        }


        private string ConnStr =>
            _configuration.GetConnectionString("EmployeeAppCon")
            ?? throw new InvalidOperationException("Missing conn string 'EmployeeAppCon'.");

        // DTO returned to clients (matches the video fields)
        public class EmployeeDto
        {
            public int EmployeeId { get; set; }
            public string EmployeeName { get; set; } = string.Empty;
            public string Department { get; set; } = string.Empty;
            public string DateOfJoining { get; set; } = string.Empty; // "yyyy-MM-dd"
            public string PhotoFileName { get; set; } = string.Empty;
        }

        // model used for create/update payloads
        public class EmployeeUpsert
        {
            public string EmployeeName { get; set; } = string.Empty;
            public string Department { get; set; } = string.Empty;
            // Accept "yyyy-MM-dd" as in the video
            public string DateOfJoining { get; set; } = string.Empty;
            public string PhotoFileName { get; set; } = string.Empty;
        }

        // GET: api/employee
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            const string sql = @"
                SELECT
                    EmployeeId,
                    EmployeeName,
                    Department,
                    CONVERT(varchar(10), DateOfJoining, 120) AS DateOfJoining,
                    PhotoFileName
                FROM dbo.Employee
                ORDER BY EmployeeId;";

            var results = new List<EmployeeDto>();
            await using var con = new SqlConnection(ConnStr);
            await con.OpenAsync();
            await using var cmd = new SqlCommand(sql, con);
            await using var rdr = await cmd.ExecuteReaderAsync();

            while (await rdr.ReadAsync())
            {
                results.Add(new EmployeeDto
                {
                    EmployeeId = rdr.GetInt32(0),
                    EmployeeName = rdr.GetString(1),
                    Department = rdr.GetString(2),
                    DateOfJoining = rdr.GetString(3), // already "yyyy-MM-dd"
                    PhotoFileName = rdr.GetString(4)
                });
            }

            return Ok(results);
        }

        // GET: api/employee/1
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            const string sql = @"
                SELECT
                    EmployeeId,
                    EmployeeName,
                    Department,
                    CONVERT(varchar(10), DateOfJoining, 120) AS DateOfJoining,
                    PhotoFileName
                FROM dbo.Employee
                WHERE EmployeeId = @id;";

            await using var con = new SqlConnection(ConnStr);
            await con.OpenAsync();
            await using var cmd = new SqlCommand(sql, con);
            cmd.Parameters.AddWithValue("@id", id);

            await using var rdr = await cmd.ExecuteReaderAsync();
            if (!await rdr.ReadAsync()) return NotFound();

            var emp = new EmployeeDto
            {
                EmployeeId = rdr.GetInt32(0),
                EmployeeName = rdr.GetString(1),
                Department = rdr.GetString(2),
                DateOfJoining = rdr.GetString(3),
                PhotoFileName = rdr.GetString(4)
            };
            return Ok(emp);
        }

        // POST: api/employee
        // Body (raw JSON):
        // { "EmployeeName":"Bob", "Department":"IT", "DateOfJoining":"2021-06-17", "PhotoFileName":"anonymous.png" }
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] EmployeeUpsert body)
        {
            const string sql = @"
                INSERT INTO dbo.Employee (EmployeeName, Department, DateOfJoining, PhotoFileName)
                VALUES (@EmployeeName, @Department, @DateOfJoining, @PhotoFileName);
                SELECT CAST(SCOPE_IDENTITY() AS int);";

            // Parse the date string safely; default to today if empty/invalid
            DateTime date = DateTime.TryParse(body.DateOfJoining, out var d) ? d : DateTime.Today;

            await using var con = new SqlConnection(ConnStr);
            await con.OpenAsync();
            await using var cmd = new SqlCommand(sql, con);
            cmd.Parameters.AddWithValue("@EmployeeName", body.EmployeeName ?? string.Empty);
            cmd.Parameters.AddWithValue("@Department", body.Department ?? string.Empty);
            cmd.Parameters.AddWithValue("@DateOfJoining", date);
            cmd.Parameters.AddWithValue("@PhotoFileName", body.PhotoFileName ?? string.Empty);

            var newId = (int)(await cmd.ExecuteScalarAsync() ?? 0);

            // Return the newly created row in the same shape as the video
            var created = new EmployeeDto
            {
                EmployeeId = newId,
                EmployeeName = body.EmployeeName ?? string.Empty,
                Department = body.Department ?? string.Empty,
                DateOfJoining = date.ToString("yyyy-MM-dd"),
                PhotoFileName = body.PhotoFileName ?? string.Empty
            };

            return CreatedAtAction(nameof(GetById), new { id = newId }, created);
        }

        // PUT: api/employee/1
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Put(int id, [FromBody] EmployeeUpsert body)
        {
            const string sql = @"
                UPDATE dbo.Employee
                SET EmployeeName = @EmployeeName,
                    Department   = @Department,
                    DateOfJoining= @DateOfJoining,
                    PhotoFileName= @PhotoFileName
                WHERE EmployeeId = @EmployeeId;

                SELECT
                    EmployeeId,
                    EmployeeName,
                    Department,
                    CONVERT(varchar(10), DateOfJoining, 120) AS DateOfJoining,
                    PhotoFileName
                FROM dbo.Employee
                WHERE EmployeeId = @EmployeeId;";

            DateTime date = DateTime.TryParse(body.DateOfJoining, out var d) ? d : DateTime.Today;

            await using var con = new SqlConnection(ConnStr);
            await con.OpenAsync();
            await using var cmd = new SqlCommand(sql, con);
            cmd.Parameters.AddWithValue("@EmployeeId", id);
            cmd.Parameters.AddWithValue("@EmployeeName", body.EmployeeName ?? string.Empty);
            cmd.Parameters.AddWithValue("@Department", body.Department ?? string.Empty);
            cmd.Parameters.AddWithValue("@DateOfJoining", date);
            cmd.Parameters.AddWithValue("@PhotoFileName", body.PhotoFileName ?? string.Empty);

            await using var rdr = await cmd.ExecuteReaderAsync();
            if (!await rdr.ReadAsync()) return NotFound();

            var updated = new EmployeeDto
            {
                EmployeeId = rdr.GetInt32(0),
                EmployeeName = rdr.GetString(1),
                Department = rdr.GetString(2),
                DateOfJoining = rdr.GetString(3),
                PhotoFileName = rdr.GetString(4)
            };
            return Ok(updated);
        }

        // DELETE: api/employee/1
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            const string sql = "DELETE FROM dbo.Employee WHERE EmployeeId = @EmployeeId;";
            await using var con = new SqlConnection(ConnStr);
            await con.OpenAsync();
            await using var cmd = new SqlCommand(sql, con);
            cmd.Parameters.AddWithValue("@EmployeeId", id);
            var rows = await cmd.ExecuteNonQueryAsync();
            return rows > 0 ? NoContent() : NotFound();
        }
        // ✅ POST /api/employee/SaveFile  (Body → form-data → key=file)
        [HttpPost("SaveFile")]
        public async Task<IActionResult> SaveFile([FromForm] IFormFile? file)
        {
            try
            {
                if (file is null || file.Length == 0)
                    return BadRequest("No file uploaded.");

                var photosPath = Path.Combine(_env.ContentRootPath, "Photos");
                Directory.CreateDirectory(photosPath);

                var fileName = Path.GetFileName(file.FileName);   // e.g., anonymous.PNG
                var fullPath = Path.Combine(photosPath, fileName);

                await using var stream = new FileStream(fullPath, FileMode.Create);
                await file.CopyToAsync(stream);

                return new JsonResult(fileName);  // → "anonymous.PNG"
            }
            catch
            {
                return new JsonResult("anonymous.png");
            }
        }
    }
}