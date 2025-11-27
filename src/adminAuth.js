const bcrypt = require("bcryptjs");
const database = require("./database");

function requireAuth(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  }
  res.redirect("/admin/login");
}

async function initializeDefaultAdmin() {
  const existing = await database.getAdminByUsername("admin");
  if (!existing) {
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || "admin123";
    const hash = await bcrypt.hash(defaultPassword, 10);
    await database.createAdminUser("admin", hash);
    console.log(
      `Default admin created. Username: admin, Password: ${defaultPassword}`
    );
  } else {
    console.log('Default admin user already exists');
  }
}

module.exports = {
  requireAuth,
  initializeDefaultAdmin,
};
