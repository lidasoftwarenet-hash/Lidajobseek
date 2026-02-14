import { Entity, PrimaryKey, Property, ManyToOne, OneToMany, Collection } from '@mikro-orm/core';
import { User } from '../users/user.entity';
import { Resource } from './resource.entity';

@Entity({ schema: 'app' })
export class Folder {
    @PrimaryKey()
    id!: number;

    @Property()
    name!: string;

    @ManyToOne(() => Folder, { nullable: true })
    parent?: Folder;

    @OneToMany(() => Folder, folder => folder.parent)
    children = new Collection<Folder>(this);

    @OneToMany(() => Resource, resource => resource.folder)
    resources = new Collection<Resource>(this);

    @ManyToOne(() => User)
    user!: User;

    @Property({ onCreate: () => new Date() })
    createdAt: Date = new Date();

    @Property({ onUpdate: () => new Date() })
    updatedAt: Date = new Date();
}
