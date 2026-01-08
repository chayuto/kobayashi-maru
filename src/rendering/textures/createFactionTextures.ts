/**
 * Factory function for creating all faction textures
 */
import { Application } from 'pixi.js';
import { FACTION_COLORS } from '../../types';
import { TextureCache } from '../TextureCache';
import { FactionTextures, TEXTURE_KEYS } from './types';
import {
    createFederationTexture,
    createKobayashiMaruTexture,
    createKlingonTexture,
    createRomulanTexture,
    createBorgTexture,
    createTholianTexture,
    createSpecies8472Texture,
    createProjectileTexture
} from './factionTextures';
import {
    createTurretBasePhaserTexture,
    createTurretBarrelPhaserTexture,
    createTurretBaseTorpedoTexture,
    createTurretBarrelTorpedoTexture,
    createTurretBaseDisruptorTexture,
    createTurretBarrelDisruptorTexture,
    createTurretBaseTetryonTexture,
    createTurretBarrelTetryonTexture,
    createTurretBasePlasmaTexture,
    createTurretBarrelPlasmaTexture,
    createTurretBasePolaronTexture,
    createTurretBarrelPolaronTexture
} from './turretTextures';

/**
 * Create all faction textures with caching support
 * Returns cached textures if available, otherwise creates and caches them
 */
export function createFactionTextures(app: Application): FactionTextures {
    const cache = TextureCache.getInstance();

    // Check if key textures are cached (simplified check)
    if (cache.has(TEXTURE_KEYS.federation) && cache.has(TEXTURE_KEYS.turretBasePhaser)) {
        return {
            federation: cache.get(TEXTURE_KEYS.federation)!,
            kobayashiMaru: cache.get(TEXTURE_KEYS.kobayashiMaru)!,
            klingon: cache.get(TEXTURE_KEYS.klingon)!,
            romulan: cache.get(TEXTURE_KEYS.romulan)!,
            borg: cache.get(TEXTURE_KEYS.borg)!,
            tholian: cache.get(TEXTURE_KEYS.tholian)!,
            species8472: cache.get(TEXTURE_KEYS.species8472)!,
            projectile: cache.get(TEXTURE_KEYS.projectile)!,
            turretPhaser: cache.get(TEXTURE_KEYS.turretPhaser)!,
            turretTorpedo: cache.get(TEXTURE_KEYS.turretTorpedo)!,
            turretDisruptor: cache.get(TEXTURE_KEYS.turretDisruptor)!,
            turretTetryon: cache.get(TEXTURE_KEYS.turretTetryon)!,
            turretPlasma: cache.get(TEXTURE_KEYS.turretPlasma)!,
            turretPolaron: cache.get(TEXTURE_KEYS.turretPolaron)!,
            turretBasePhaser: cache.get(TEXTURE_KEYS.turretBasePhaser)!,
            turretBarrelPhaser: cache.get(TEXTURE_KEYS.turretBarrelPhaser)!,
            turretBaseTorpedo: cache.get(TEXTURE_KEYS.turretBaseTorpedo)!,
            turretBarrelTorpedo: cache.get(TEXTURE_KEYS.turretBarrelTorpedo)!,
            turretBaseDisruptor: cache.get(TEXTURE_KEYS.turretBaseDisruptor)!,
            turretBarrelDisruptor: cache.get(TEXTURE_KEYS.turretBarrelDisruptor)!,
            turretBaseTetryon: cache.get(TEXTURE_KEYS.turretBaseTetryon)!,
            turretBarrelTetryon: cache.get(TEXTURE_KEYS.turretBarrelTetryon)!,
            turretBasePlasma: cache.get(TEXTURE_KEYS.turretBasePlasma)!,
            turretBarrelPlasma: cache.get(TEXTURE_KEYS.turretBarrelPlasma)!,
            turretBasePolaron: cache.get(TEXTURE_KEYS.turretBasePolaron)!,
            turretBarrelPolaron: cache.get(TEXTURE_KEYS.turretBarrelPolaron)!
        };
    }

    // Create and cache textures
    const federation = createFederationTexture(app, FACTION_COLORS.FEDERATION);
    const kobayashiMaru = createKobayashiMaruTexture(app);
    const klingon = createKlingonTexture(app, FACTION_COLORS.KLINGON);
    const romulan = createRomulanTexture(app, FACTION_COLORS.ROMULAN);
    const borg = createBorgTexture(app, FACTION_COLORS.BORG);
    const tholian = createTholianTexture(app, FACTION_COLORS.THOLIAN);
    const species8472 = createSpecies8472Texture(app, FACTION_COLORS.SPECIES_8472);
    const projectile = createProjectileTexture(app, FACTION_COLORS.PROJECTILE);

    // Legacy/Composite fallbacks (just in case)
    const turretPhaser = createTurretBasePhaserTexture(app);
    const turretTorpedo = createTurretBaseTorpedoTexture(app);
    const turretDisruptor = createTurretBaseDisruptorTexture(app);
    const turretTetryon = createTurretBaseTetryonTexture(app);
    const turretPlasma = createTurretBasePlasmaTexture(app);
    const turretPolaron = createTurretBasePolaronTexture(app);

    // New split textures
    const turretBasePhaser = createTurretBasePhaserTexture(app);
    const turretBarrelPhaser = createTurretBarrelPhaserTexture(app, FACTION_COLORS.FEDERATION);
    const turretBaseTorpedo = createTurretBaseTorpedoTexture(app);
    const turretBarrelTorpedo = createTurretBarrelTorpedoTexture(app);
    const turretBaseDisruptor = createTurretBaseDisruptorTexture(app);
    const turretBarrelDisruptor = createTurretBarrelDisruptorTexture(app);
    const turretBaseTetryon = createTurretBaseTetryonTexture(app);
    const turretBarrelTetryon = createTurretBarrelTetryonTexture(app);
    const turretBasePlasma = createTurretBasePlasmaTexture(app);
    const turretBarrelPlasma = createTurretBarrelPlasmaTexture(app);
    const turretBasePolaron = createTurretBasePolaronTexture(app);
    const turretBarrelPolaron = createTurretBarrelPolaronTexture(app);

    cache.set(TEXTURE_KEYS.federation, federation);
    cache.set(TEXTURE_KEYS.kobayashiMaru, kobayashiMaru);
    cache.set(TEXTURE_KEYS.klingon, klingon);
    cache.set(TEXTURE_KEYS.romulan, romulan);
    cache.set(TEXTURE_KEYS.borg, borg);
    cache.set(TEXTURE_KEYS.tholian, tholian);
    cache.set(TEXTURE_KEYS.species8472, species8472);
    cache.set(TEXTURE_KEYS.projectile, projectile);
    cache.set(TEXTURE_KEYS.turretPhaser, turretPhaser);
    cache.set(TEXTURE_KEYS.turretTorpedo, turretTorpedo);
    cache.set(TEXTURE_KEYS.turretDisruptor, turretDisruptor);
    cache.set(TEXTURE_KEYS.turretTetryon, turretTetryon);
    cache.set(TEXTURE_KEYS.turretPlasma, turretPlasma);
    cache.set(TEXTURE_KEYS.turretPolaron, turretPolaron);

    cache.set(TEXTURE_KEYS.turretBasePhaser, turretBasePhaser);
    cache.set(TEXTURE_KEYS.turretBarrelPhaser, turretBarrelPhaser);
    cache.set(TEXTURE_KEYS.turretBaseTorpedo, turretBaseTorpedo);
    cache.set(TEXTURE_KEYS.turretBarrelTorpedo, turretBarrelTorpedo);
    cache.set(TEXTURE_KEYS.turretBaseDisruptor, turretBaseDisruptor);
    cache.set(TEXTURE_KEYS.turretBarrelDisruptor, turretBarrelDisruptor);
    cache.set(TEXTURE_KEYS.turretBaseTetryon, turretBaseTetryon);
    cache.set(TEXTURE_KEYS.turretBarrelTetryon, turretBarrelTetryon);
    cache.set(TEXTURE_KEYS.turretBasePlasma, turretBasePlasma);
    cache.set(TEXTURE_KEYS.turretBarrelPlasma, turretBarrelPlasma);
    cache.set(TEXTURE_KEYS.turretBasePolaron, turretBasePolaron);
    cache.set(TEXTURE_KEYS.turretBarrelPolaron, turretBarrelPolaron);

    return {
        federation,
        kobayashiMaru,
        klingon,
        romulan,
        borg,
        tholian,
        species8472,
        projectile,
        turretPhaser,
        turretTorpedo,
        turretDisruptor,
        turretTetryon,
        turretPlasma,
        turretPolaron,
        turretBasePhaser,
        turretBarrelPhaser,
        turretBaseTorpedo,
        turretBarrelTorpedo,
        turretBaseDisruptor,
        turretBarrelDisruptor,
        turretBaseTetryon,
        turretBarrelTetryon,
        turretBasePlasma,
        turretBarrelPlasma,
        turretBasePolaron,
        turretBarrelPolaron
    };
}
