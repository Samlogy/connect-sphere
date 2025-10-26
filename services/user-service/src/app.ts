import express from "express";
import dotenv from "dotenv";
import controller from "./controller";
import middleware from "./middleware";

dotenv.config();
const app = express();
const router = express.Router();

router.post("/register", controller.register);
router.post("/login", controller.login);

// router.get("/me", middleware.auth.authenticate, async (req: any, res: Response) => {
//   res.json({ user: req.user });
// });


app.use(express.json());
app.use("/api/users", router);

export async function startServer() {
  const port = process.env.PORT || 4001;
  app.listen(port, () => console.log(`✅ User service => ${port}`));
}


export default startServer