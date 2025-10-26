import express from "express";
import dotenv from "dotenv";
import controller from "./controller";
import middleware from "./middleware";

dotenv.config();
const app = express();
const router = express.Router();


// User
router.post("/register", controller.user.register);
router.post("/login", controller.user.login);

// Profile
router.get('/:id', controller.user.getUserProfile);
router.put('/:id', controller.follow.updateUserProfile);

// Follow system
router.get('/:id', controller.user.getUserProfile);
router.post('/follow', controller.follow.followUser);
router.post('/unfollow', controller.follow.unfollowUser);
router.get('/:id/followers', controller.follow.getFollowers);
router.get('/:id/following', controller.follow.getFollowing);

// router.get("/me", middleware.auth.authenticate, async (req: any, res: Response) => {
//   res.json({ user: req.user });
// });

app.use(express.json());
app.use("/api/users/v1", router);

export async function startServer() {
  const port = process.env.PORT || 4001;
  app.listen(port, () => console.log(`✅ User service => ${port}`));
}


export default startServer