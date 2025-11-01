import dotenv from "dotenv";
import { Application } from "express";
import controller from "./controllers";

dotenv.config();


/* Routes */
const UserServiceRoutes = (app: Application) => {
    // User
    app.post("/register", controller.user.register);
    app.post("/login", controller.user.login);

    // Profile
    app.get('/:id', controller.user.getUserProfile);
    app.put('/:id', controller.follow.updateUserProfile);

    // Follow
    app.post('/follow', controller.follow.followUser);
    app.post('/unfollow', controller.follow.unfollowUser);
    app.get('/:id/followers', controller.follow.getFollowers);
    app.get('/:id/following', controller.follow.getFollowing);

    app.use("/api/v1/users", app);
}


export default {
    UserServiceRoutes
}