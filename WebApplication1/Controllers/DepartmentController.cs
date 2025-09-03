using Microsoft.AspNetCore.Mvc;
using System.Data.SqlClient;   // or Microsoft.Data.SqlClient

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DepartmentController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        public DepartmentController(IConfiguration configuration) => _configuration = configuration;

        private string ConnStr =>
            _configuration.GetConnectionString("EmployeeAppCon")
            ?? throw new InvalidOperationException("Missing conn string 'EmployeeAppCon'.");

        public class DepartmentDto
        {
            public int DepartmentId { get; set; }
            public string DepartmentName { get; set; } = string.Empty;
        }

        // GET: api/Department
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            const string sql = "SELECT DepartmentId, DepartmentName FROM dbo.Department ORDER BY DepartmentId";
            var results = new List<DepartmentDto>();
            await using var con = new SqlConnection(ConnStr);
            await con.OpenAsync();
            await using var cmd = new SqlCommand(sql, con);
            await using var rdr = await cmd.ExecuteReaderAsync();
            while (await rdr.ReadAsync())
            {
                results.Add(new DepartmentDto { DepartmentId = rdr.GetInt32(0), DepartmentName = rdr.GetString(1) });
            }
            return Ok(results);
        }

        // GET: api/Department/1003
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            const string sql = "SELECT DepartmentId, DepartmentName FROM dbo.Department WHERE DepartmentId=@id";
            await using var con = new SqlConnection(ConnStr);
            await con.OpenAsync();
            await using var cmd = new SqlCommand(sql, con);
            cmd.Parameters.AddWithValue("@id", id);
            await using var rdr = await cmd.ExecuteReaderAsync();
            if (await rdr.ReadAsync())
            {
                return Ok(new DepartmentDto { DepartmentId = rdr.GetInt32(0), DepartmentName = rdr.GetString(1) });
            }
            return NotFound();
        }

        // POST: api/Department
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] DepartmentDto dep)
        {
            const string sql = @"
                INSERT INTO dbo.Department (DepartmentName)
                VALUES (@DepartmentName);
                SELECT CAST(SCOPE_IDENTITY() AS int);";

            await using var con = new SqlConnection(ConnStr);
            await con.OpenAsync();
            await using var cmd = new SqlCommand(sql, con);
            cmd.Parameters.AddWithValue("@DepartmentName", (object?)dep.DepartmentName ?? DBNull.Value);

            dep.DepartmentId = Convert.ToInt32(await cmd.ExecuteScalarAsync());
            return CreatedAtAction(nameof(GetById), new { id = dep.DepartmentId }, dep);
        }

        // PUT: api/Department/1003
        // PUT: api/Department
        [HttpPut]
        public async Task<IActionResult> Put([FromBody] DepartmentDto dep)
        {
            const string sql = @"
        UPDATE dbo.Department
        SET DepartmentName = @DepartmentName
        OUTPUT INSERTED.DepartmentId, INSERTED.DepartmentName
        WHERE DepartmentId = @DepartmentId;";

            await using var con = new SqlConnection(ConnStr);
            await con.OpenAsync();
            await using var cmd = new SqlCommand(sql, con);
            cmd.Parameters.AddWithValue("@DepartmentName", (object?)dep.DepartmentName ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@DepartmentId", dep.DepartmentId);

            await using var rdr = await cmd.ExecuteReaderAsync();
            if (await rdr.ReadAsync())
            {
                var updated = new DepartmentDto
                {
                    DepartmentId = rdr.GetInt32(0),
                    DepartmentName = rdr.GetString(1)
                };
                return Ok(updated); // <-- immediate JSON of the updated row
            }

            return NotFound();
        }


        // DELETE: api/Department/1003
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            const string sql = "DELETE FROM dbo.Department WHERE DepartmentId = @DepartmentId;";
            await using var con = new SqlConnection(ConnStr);
            await con.OpenAsync();
            await using var cmd = new SqlCommand(sql, con);
            cmd.Parameters.AddWithValue("@DepartmentId", id);
            var rows = await cmd.ExecuteNonQueryAsync();
            return rows > 0 ? NoContent() : NotFound();
        }
    }
}

