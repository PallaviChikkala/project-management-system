const http = require("http");
const app = require("../src/app");
const prisma = require("../src/config/prisma");

async function runTests() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`Running PMS Backend Integration Tests at ${baseUrl}`);

  async function request(method, path, body = null, token = null) {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✓ ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ ${testName}`);
      failed++;
    }
  }

  try {
    console.log("\n[Test Suite 1: Health & Authentication]");
    const health = await request("GET", "/api/health");
    assert(health.status === 200 && health.data.success === true, "Health endpoint returns 200 OK");

    const email = `test_${Date.now()}@example.com`;
    const regRes = await request("POST", "/api/auth/register", {
      fullName: "Integration Tester",
      email,
      password: "securepassword123",
    });
    assert(regRes.status === 201 && regRes.data.token, "User registration succeeds with JWT token");
    const token = regRes.data.token;

    const dupRes = await request("POST", "/api/auth/register", {
      fullName: "Duplicate User",
      email,
      password: "securepassword123",
    });
    assert(dupRes.status === 409, "Duplicate registration rejected with 409 Conflict");

    const loginRes = await request("POST", "/api/auth/login", {
      email,
      password: "securepassword123",
    });
    assert(loginRes.status === 200 && loginRes.data.token, "User login succeeds");

    const badLoginRes = await request("POST", "/api/auth/login", {
      email,
      password: "wrongpassword",
    });
    assert(badLoginRes.status === 401, "Invalid password returns 401 Unauthorized");

    const meRes = await request("GET", "/api/auth/me", null, token);
    assert(meRes.status === 200 && meRes.data.user.email === email, "GET /api/auth/me returns current user profile");

    console.log("\n[Test Suite 2: Projects Management]");
    const projRes = await request(
      "POST",
      "/api/projects",
      {
        name: "Q4 Marketing Campaign",
        description: "Scale user acquisition across digital channels",
        status: "NOT_STARTED",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      },
      token
    );
    assert(projRes.status === 201 && projRes.data.data.name === "Q4 Marketing Campaign", "Project creation succeeds");
    const projectId = projRes.data.data.id;

    const getProjRes = await request("GET", `/api/projects/${projectId}`, null, token);
    assert(getProjRes.status === 200 && getProjRes.data.data.id === projectId, "Get project by ID succeeds");

    const updateProjRes = await request(
      "PUT",
      `/api/projects/${projectId}`,
      { status: "IN_PROGRESS" },
      token
    );
    assert(updateProjRes.status === 200 && updateProjRes.data.data.status === "IN_PROGRESS", "Update project status succeeds");

    console.log("\n[Test Suite 3: Tasks Management]");
    const taskRes = await request(
      "POST",
      "/api/tasks",
      {
        projectId,
        name: "Create Ad Creatives",
        description: "Banners and video cuts for social media",
        priority: "HIGH",
        status: "PENDING",
        dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      },
      token
    );
    assert(taskRes.status === 201 && taskRes.data.data.name === "Create Ad Creatives", "Task creation succeeds");
    const taskId = taskRes.data.data.id;

    const updateTaskRes = await request(
      "PUT",
      `/api/tasks/${taskId}`,
      { status: "COMPLETED" },
      token
    );
    assert(updateTaskRes.status === 200 && updateTaskRes.data.data.status === "COMPLETED", "Mark task as COMPLETED succeeds");

    console.log("\n[Test Suite 4: Dashboard & Authorization]");
    const dashRes = await request("GET", "/api/dashboard", null, token);
    assert(
      dashRes.status === 200 &&
        dashRes.data.data.totalProjects >= 1 &&
        dashRes.data.data.completedTasks >= 1,
      "Dashboard returns user-specific aggregated metrics"
    );

    // Another user authorization check
    const otherEmail = `other_${Date.now()}@example.com`;
    const otherReg = await request("POST", "/api/auth/register", {
      fullName: "Other User",
      email: otherEmail,
      password: "password123",
    });
    const otherToken = otherReg.data.token;

    const forbiddenProjRes = await request("GET", `/api/projects/${projectId}`, null, otherToken);
    assert(forbiddenProjRes.status === 404, "Cross-user project access forbidden (returns 404)");

    const forbiddenTaskRes = await request("GET", `/api/tasks/${taskId}`, null, otherToken);
    assert(forbiddenTaskRes.status === 404, "Cross-user task access forbidden (returns 404)");

    console.log("\n[Test Suite 5: Cleanup & Deletion]");
    const delTask = await request("DELETE", `/api/tasks/${taskId}`, null, token);
    assert(delTask.status === 200, "Task deletion succeeds");

    const delProj = await request("DELETE", `/api/projects/${projectId}`, null, token);
    assert(delProj.status === 200, "Project deletion succeeds");

    console.log(`\nTests finished: ${passed} passed, ${failed} failed.`);
    if (failed > 0) process.exit(1);
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
