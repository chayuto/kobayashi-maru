/**
 * ECS module barrel export for Kobayashi Maru
 * Contains Entity-Component-System architecture components
 * 
 * @module ecs
 */

// Core ECS
export * from './components';
export * from './world';

// Entity creation and templates
export * from './entityFactory';
export * from './entityPool';
export * from './entityTemplates';
export * from './genericFactory';

// Entity lifecycle
export * from './entityReset';
export * from './archetypes';
export * from './componentValidation';
