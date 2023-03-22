import { authRouter } from "./auth"
import { _SystemRouter } from "./_system"

const routers = {
    _system: _SystemRouter,
    auth: authRouter
}

export default routers