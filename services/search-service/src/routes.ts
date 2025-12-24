import { Application, Router } from "express";
import controllers from "./controllers";


/* Routes */
const SearchServiceRoutes = (route: string, app: Application) => {
    const router = Router();
    
    router.get(route + '/', controllers.search.search);
    router.post(route + '/reindex', controllers.search.reindex);
    router.get(route + '/health', controllers.search.health);

    app.use(router);
}


export default {
    SearchServiceRoutes
}