using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
namespace WebApplication1.Models
{
    public class Employee
    {
        public int EmployeeId { get; set; }

        public string EmployeeName { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;

        // Prefer a date type instead of string:
        public DateTime DateOfJoining { get; set; }   // defaults to 0001-01-01

        public string PhotoFileName { get; set; } = string.Empty;
    }
}
