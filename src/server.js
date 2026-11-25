const http = require("node:http");
const store = require("./data/store");

const PORT = process.env.PORT || 3000;
const APP_NAME = process.env.APP_NAME || "CampusOps";

let nextComplaintId = store.complaints.length + 1;
let nextLogId = store.ticket_logs.length + 1;

function generateTicketCode() {
  const year = new Date().getFullYear();
  const num = String(nextComplaintId).padStart(4, "0");
  return `TCK-${year}-${num}`;
}

function getSummary() {
  const total = store.complaints.length;
  const open = store.complaints.filter((c) => c.status === "Open").length;
  const inProgress = store.complaints.filter((c) => c.status === "In Progress").length;
  const resolved = store.complaints.filter((c) => c.status === "Resolved").length;
  const closedRejected = store.complaints.filter((c) => c.status === "Closed/Rejected").length;
  const activeUnresolved = open + inProgress;

  return {
    total,
    open,
    in_progress: inProgress,
    resolved,
    closed_rejected: closedRejected,
    active_unresolved: activeUnresolved
  };
}

function enrichTickets() {
  return store.complaints.map((complaint) => {
    const category = store.facility_categories.find((cat) => cat.id === complaint.category_id);
    const reporter = store.users.find((u) => u.id === complaint.reporter_id);
    const assignee = store.users.find((u) => u.id === complaint.assigned_to_id);
    const logs = store.ticket_logs.filter((log) => log.complaint_id === complaint.id);

    return {
      ...complaint,
      category_name: category ? category.name : "General",
      reporter_name: reporter ? reporter.full_name : "Unknown Reporter",
      assigned_to_name: assignee ? assignee.full_name : "Unassigned",
      logs
    };
  });
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error("Invalid JSON payload"));
      }
    });
    req.on("error", reject);
  });
}

function renderHtmlPage() {
  const summary = getSummary();
  const tickets = enrichTickets();
  const categoriesOptions = store.facility_categories
    .map((c) => `<option value="${c.id}">${c.name}</option>`)
    .join("");
  const techOptions = store.users
    .filter((u) => u.role === "technician")
    .map((t) => `<option value="${t.id}">${t.full_name}</option>`)
    .join("");

  const rowsHtml = tickets
    .map((t) => {
      const latestNote = t.logs.length > 0 ? t.logs[t.logs.length - 1].note : "-";
      return `
        <tr>
          <td><strong>${t.ticket_code}</strong><br><small>${t.title}</small></td>
          <td>${t.location}<br><small>Category: ${t.category_name}</small></td>
          <td><strong>${t.priority}</strong></td>
          <td><strong>${t.status}</strong></td>
          <td>${t.assigned_to_name}</td>
          <td><small>${latestNote}</small></td>
        </tr>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP_NAME} — Initial Prototype</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1000px; margin: 24px auto; padding: 0 16px; color: #1f2937; }
    h1, h2 { margin-bottom: 8px; }
    .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0 24px; }
    .card { border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; background: #f9fafb; }
    .card .num { font-size: 24px; font-weight: bold; margin-top: 4px; }
    form { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
    label { display: block; font-size: 13px; font-weight: bold; margin-bottom: 4px; }
    input, select, textarea, button { width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; box-sizing: border-box; }
    .full { grid-column: 1 / -1; }
    button { background: #111827; color: #fff; font-weight: bold; cursor: pointer; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; }
  </style>
</head>
<body>
  <h1>${APP_NAME} — Initial System Prototype</h1>
  <p>Facility Complaint and Service Request System (MVP Prototype)</p>

  <div class="cards">
    <div class="card"><div>Total Tickets</div><div class="num">${summary.total}</div></div>
    <div class="card"><div>Open</div><div class="num">${summary.open}</div></div>
    <div class="card"><div>In Progress</div><div class="num">${summary.in_progress}</div></div>
    <div class="card"><div>Resolved</div><div class="num">${summary.resolved}</div></div>
  </div>

  <h2>Submit Facility Complaint</h2>
  <form id="complaintForm">
    <div>
      <label for="title">Title</label>
      <input id="title" name="title" placeholder="e.g., Projector not turning on" required />
    </div>
    <div>
      <label for="location">Building / Location</label>
      <input id="location" name="location" placeholder="e.g., Building B - Room 102" required />
    </div>
    <div>
      <label for="category_id">Category</label>
      <select id="category_id" name="category_id">${categoriesOptions}</select>
    </div>
    <div>
      <label for="priority">Suggested / Initial Priority</label>
      <select id="priority" name="priority">
        <option value="Low">Low</option>
        <option value="Medium" selected>Medium</option>
        <option value="High">High</option>
      </select>
    </div>
    <div class="full">
      <label for="description">Description</label>
      <textarea id="description" name="description" rows="3" placeholder="Describe the facility issue..." required></textarea>
    </div>
    <div class="full">
      <button type="submit">Submit Complaint</button>
    </div>
  </form>

  <h2>Tickets & Latest Progress Notes</h2>
  <table>
    <thead>
      <tr>
        <th>Ticket ID & Title</th>
        <th>Location & Category</th>
        <th>Priority</th>
        <th>Status</th>
        <th>Assigned PIC</th>
        <th>Latest Note</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  <script>
    document.getElementById("complaintForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const payload = Object.fromEntries(formData.entries());
      payload.category_id = Number(payload.category_id);

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        window.location.reload();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to submit complaint");
      }
    });
  </script>
</body>
</html>`;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return res.end(renderHtmlPage());
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ status: "ok", app: APP_NAME }));
  }

  if (req.method === "GET" && url.pathname === "/api/tickets") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(
      JSON.stringify({
        summary: getSummary(),
        data: enrichTickets()
      })
    );
  }

  if (req.method === "POST" && url.pathname === "/api/tickets") {
    try {
      const body = await parseJsonBody(req);
      if (!body.title || !body.location || !body.description) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "title, location, and description are required" }));
      }

      const now = new Date().toISOString();
      const validPriorities = ["Low", "Medium", "High"];
      const priority = validPriorities.includes(body.priority) ? body.priority : "Medium";

      const newTicket = {
        id: nextComplaintId++,
        ticket_code: generateTicketCode(),
        reporter_id: body.reporter_id || 1,
        category_id: body.category_id || 1,
        assigned_to_id: null,
        location: body.location.trim(),
        title: body.title.trim(),
        description: body.description.trim(),
        priority,
        status: "Open",
        created_at: now,
        updated_at: now
      };

      store.complaints.push(newTicket);
      store.ticket_logs.push({
        id: nextLogId++,
        complaint_id: newTicket.id,
        actor_id: newTicket.reporter_id,
        action_type: "CREATED",
        old_status: null,
        new_status: "Open",
        note: "Complaint submitted and assigned unique Ticket ID.",
        created_at: now
      });

      res.writeHead(201, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Ticket created", data: newTicket }));
    } catch (err) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  const patchMatch = url.pathname.match(/^\/api\/tickets\/(\d+)$/);
  if (req.method === "PATCH" && patchMatch) {
    try {
      const ticketId = Number(patchMatch[1]);
      const ticket = store.complaints.find((c) => c.id === ticketId);
      if (!ticket) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Ticket not found" }));
      }

      const body = await parseJsonBody(req);
      const oldStatus = ticket.status;
      const validPriorities = ["Low", "Medium", "High"];
      const validStatuses = ["Open", "In Progress", "Resolved", "Closed/Rejected"];

      if (body.priority && validPriorities.includes(body.priority)) {
        ticket.priority = body.priority;
      }

      if (body.assigned_to_id !== undefined) {
        ticket.assigned_to_id = body.assigned_to_id;
      }

      if (body.status && validStatuses.includes(body.status)) {
        ticket.status = body.status;
      }

      ticket.updated_at = new Date().toISOString();

      store.ticket_logs.push({
        id: nextLogId++,
        complaint_id: ticket.id,
        actor_id: body.actor_id || 2,
        action_type: "UPDATED",
        old_status: oldStatus,
        new_status: ticket.status,
        note: body.note || "Ticket updated.",
        created_at: ticket.updated_at
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ message: "Ticket updated", data: ticket }));
    } catch (err) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`${APP_NAME} prototype running at http://localhost:${PORT}`);
});
