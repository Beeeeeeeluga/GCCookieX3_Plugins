/**
 * pretag.js - BedrockBridge Offline Nametag Pre-loader Plugin
 *
 * Uses @minecraft/server:
 * - Listens for player spawn events to restore pending offline nametag changes
 * - Retrieves cached nametag data from world dynamic properties
 * - Applies custom nametags (esp:nameTag) to player entities upon join
 * - Cleans up offline temporary storage post-application
 * 
 * v1.0.0 by beeeeeeeluga (https://github.com/Beeeeeeeluga)
 * Discord: beeeeeeeluga (807236027189297212) 
 * More plugins: https://discord.gg/kB7dWtQZKx
 *
 * Addon Support Server: https://discord.com/invite/esploratori-development-1043447184210792468
 */

import { world, system } from "@minecraft/server";

world.afterEvents.playerSpawn.subscribe((eventData) => {
    const { player, initialSpawn } = eventData;
    
    if (!initialSpawn || !player) return;

    const pName = player.name;
    const storageKey = `offlinetag:${pName.toLowerCase()}`;

    try {
        // 讀取暫存
        let savedNameTag;
        if (typeof world.getDynamicProperty === "function") {
            savedNameTag = world.getDynamicProperty(storageKey);
        }

        if (savedNameTag) {
            system.runTimeout(() => {
                try {
                    // 檢查玩家實體是否仍在線上
                    if (!player) return;

                    console.warn(`[OfflineNametag] 準備寫入暱稱: ${savedNameTag}`);

                    // 1. 嘗試複數寫入
                    if (typeof player.setDynamicProperties === "function") {
                        player.setDynamicProperties({ "esp:nameTag": savedNameTag });
                        console.warn(`[OfflineNametag] 使用 setDynamicProperties 寫入成功`);
                    } 
                    // 2. 嘗試單數寫入
                    else if (typeof player.setDynamicProperty === "function") {
                        player.setDynamicProperty("esp:nameTag", savedNameTag);
                        console.warn(`[OfflineNametag] 使用 setDynamicProperty 寫入成功`);
                    } 
                    else {
                        console.error(`[OfflineNametag] 錯誤：player 物件上完全找不到任何動態屬性寫入函數！`);
                        return;
                    }

                    // 清空離線暫存
                    if (typeof world.setDynamicProperty === "function") {
                        world.setDynamicProperty(storageKey, undefined);
                    } else if (typeof world.setDynamicProperties === "function") {
                        world.setDynamicProperties({ [storageKey]: undefined });
                    }

                } catch (applyErr) {
                    // 印出詳細堆疊訊息，精準定位問題
                    console.error(`[OfflineNametag] 寫入過程失敗：${applyErr}\nStack: ${applyErr.stack}`);
                }
            }, 20);
        }
    } catch (err) {
        console.error(`[OfflineNametag] 外層讀取失敗：${err}`);
    }
});
