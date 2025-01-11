#!lua name=snapshot_lib

local function incr_or_reset(keys, args)
    local actionCount = redis.call("INCR", keys[1])
    if actionCount >= tonumber(args[1]) then
        redis.call("SET", keys[1], 0)
        return actionCount
    else
        return actionCount
    end
end

redis.register_function('incr_or_reset', incr_or_reset)