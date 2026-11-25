const store = {
  users: [
    { id: 1, full_name: "Nikita Reporter", email: "reporter@campus.edu", role: "reporter" },
    { id: 2, full_name: "Facilities Admin", email: "staff@campus.edu", role: "staff" },
    { id: 3, full_name: "Marcus Technician", email: "tech@campus.edu", role: "technician" }
  ],
  facility_categories: [
    { id: 1, name: "Electrical", description: "Lights, power outlets, and electrical panels" },
    { id: 2, name: "Plumbing", description: "Water leaks, sinks, and drainage" },
    { id: 3, name: "HVAC", description: "Air conditioning and ventilation" },
    { id: 4, name: "Furniture", description: "Desks, chairs, and classroom fixtures" }
  ],
  complaints: [
    {
      id: 1,
      ticket_code: "TCK-2026-0001",
      reporter_id: 1,
      category_id: 2,
      assigned_to_id: 3,
      location: "Building A - Room 204",
      title: "Water leak under washbasin",
      description: "Slow water leak under the sink in second-floor restroom.",
      priority: "Medium",
      status: "In Progress",
      created_at: "2026-11-25T10:00:00.000Z",
      updated_at: "2026-11-25T11:30:00.000Z"
    }
  ],
  ticket_logs: [
    {
      id: 1,
      complaint_id: 1,
      actor_id: 1,
      action_type: "CREATED",
      old_status: null,
      new_status: "Open",
      note: "Complaint submitted via CampusOps prototype.",
      created_at: "2026-11-25T10:00:00.000Z"
    },
    {
      id: 2,
      complaint_id: 1,
      actor_id: 2,
      action_type: "ASSIGNED_AND_UPDATED",
      old_status: "Open",
      new_status: "In Progress",
      note: "Assigned to Marcus Technician; inspection started.",
      created_at: "2026-11-25T11:30:00.000Z"
    }
  ]
};

module.exports = store;
