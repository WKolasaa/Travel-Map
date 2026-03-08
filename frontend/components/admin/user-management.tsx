"use client";

import { useMemo, useState, useTransition } from "react";
import { createAdminUser, createAdminGroup, deleteAdminGroup, updateAdminGroup, updateAdminUser, type AdminGroupInput, type AdminUserInput } from "@/lib/api";
import type { AdminDirectoryUser, AdminGroup, AdminRole } from "@/lib/auth";

const ROLES: AdminRole[] = ["viewer", "editor", "admin"];

type UserManagementProps = {
  initialUsers: AdminDirectoryUser[];
  initialGroups: AdminGroup[];
  currentUserId: string;
};

type UserDraft = {
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  password: string;
  groupIds: string[];
};

type GroupDraft = {
  name: string;
  slug: string;
  description: string;
  memberIds: string[];
};

type GroupMenuProps = {
  label: string;
  selectedIds: string[];
  groups: AdminGroup[];
  onToggle: (groupId: string) => void;
  emptyLabel: string;
  columns?: "one" | "two";
};

function toUserDraft(user: AdminDirectoryUser): UserDraft {
  return {
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    password: "",
    groupIds: user.groups.map((group) => group.id)
  };
}

function toGroupDraft(group: AdminGroup): GroupDraft {
  return {
    name: group.name,
    slug: group.slug,
    description: group.description,
    memberIds: group.memberIds
  };
}

function mapGroup(payload: Record<string, unknown>): AdminGroup {
  return {
    id: String(payload.id),
    name: String(payload.name),
    slug: String(payload.slug),
    description: String(payload.description ?? ""),
    status: payload.status === "archived" ? "archived" : "active",
    memberCount: Number(payload.member_count ?? 0),
    createdAt: String(payload.created_at),
    updatedAt: payload.updated_at ? String(payload.updated_at) : undefined,
    memberIds: Array.isArray(payload.member_ids) ? payload.member_ids.map(String) : []
  };
}

function mapUser(payload: Record<string, unknown>): AdminDirectoryUser {
  return {
    id: String(payload.id),
    email: String(payload.email),
    name: String(payload.name),
    role: payload.role as AdminRole,
    isActive: Boolean(payload.is_active),
    createdAt: String(payload.created_at),
    updatedAt: payload.updated_at ? String(payload.updated_at) : undefined,
    groups: Array.isArray(payload.groups) ? payload.groups.map((group) => mapGroup(group as Record<string, unknown>)) : []
  };
}

function toggleId(ids: string[], value: string) {
  return ids.includes(value) ? ids.filter((id) => id !== value) : [...ids, value];
}

function GroupMenu({ label, selectedIds, groups, onToggle, emptyLabel, columns = "one" }: GroupMenuProps) {
  const selectedNames = groups.filter((group) => selectedIds.includes(group.id)).map((group) => group.name);

  return (
    <details className="rounded-2xl border border-line/60 bg-ink/35 px-4 py-3 text-sm text-cloud/80">
      <summary className="cursor-pointer list-none">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-mint/70">{label}</p>
            <p className="mt-2 text-sm text-cloud/75">
              {selectedNames.length > 0 ? selectedNames.join(", ") : emptyLabel}
            </p>
          </div>
          <span className="rounded-full border border-line/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cloud/55">
            {selectedIds.length} selected
          </span>
        </div>
      </summary>
      <div className={`mt-4 grid gap-2 ${columns === "two" ? "md:grid-cols-2" : ""}`}>
        {groups.length > 0 ? groups.map((group) => (
          <label key={group.id} className="flex items-center gap-3 rounded-xl border border-line/40 px-3 py-2">
            <input type="checkbox" checked={selectedIds.includes(group.id)} onChange={() => onToggle(group.id)} />
            <span>{group.name}</span>
          </label>
        )) : <span className="text-cloud/55">{emptyLabel}</span>}
      </div>
    </details>
  );
}

export function UserManagement({ initialUsers, initialGroups, currentUserId }: UserManagementProps) {
  const [users, setUsers] = useState(initialUsers);
  const [groups, setGroups] = useState(initialGroups);
  const [createDraft, setCreateDraft] = useState<AdminUserInput>({
    name: "",
    email: "",
    password: "",
    role: "viewer",
    is_active: true,
    group_ids: []
  });
  const [groupCreateDraft, setGroupCreateDraft] = useState<AdminGroupInput>({
    name: "",
    slug: "",
    description: "",
    member_ids: []
  });
  const [editDrafts, setEditDrafts] = useState<Record<string, UserDraft>>(() => Object.fromEntries(initialUsers.map((user) => [user.id, toUserDraft(user)])));
  const [groupDrafts, setGroupDrafts] = useState<Record<string, GroupDraft>>(() => Object.fromEntries(initialGroups.map((group) => [group.id, toGroupDraft(group)])));
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [groupCreateError, setGroupCreateError] = useState<string | null>(null);
  const [groupCreateSuccess, setGroupCreateSuccess] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string | null>>({});
  const [groupErrors, setGroupErrors] = useState<Record<string, string | null>>({});
  const [isCreating, startCreateTransition] = useTransition();
  const [isCreatingGroup, startGroupCreateTransition] = useTransition();
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingGroupId, setPendingGroupId] = useState<string | null>(null);

  const sortedUsers = useMemo(() => [...users].sort((left, right) => left.createdAt.localeCompare(right.createdAt)), [users]);
  const sortedGroups = useMemo(() => [...groups].sort((left, right) => left.name.localeCompare(right.name)), [groups]);
  const activeGroups = useMemo(() => sortedGroups.filter((group) => group.status === "active"), [sortedGroups]);

  function replaceUser(nextUser: AdminDirectoryUser) {
    setUsers((current) => current.map((user) => user.id === nextUser.id ? nextUser : user));
    setEditDrafts((current) => ({ ...current, [nextUser.id]: toUserDraft(nextUser) }));
  }

  function replaceGroup(nextGroup: AdminGroup) {
    setGroups((current) => current.map((group) => group.id === nextGroup.id ? nextGroup : group));
    setGroupDrafts((current) => ({ ...current, [nextGroup.id]: toGroupDraft(nextGroup) }));
  }

  function removeGroup(groupId: string) {
    setGroups((current) => current.filter((group) => group.id !== groupId));
    setGroupDrafts((current) => {
      const next = { ...current };
      delete next[groupId];
      return next;
    });
    setUsers((current) => current.map((user) => ({
      ...user,
      groups: user.groups.filter((group) => group.id !== groupId)
    })));
    setEditDrafts((current) => Object.fromEntries(Object.entries(current).map(([userId, draft]) => [userId, {
      ...draft,
      groupIds: draft.groupIds.filter((id) => id !== groupId)
    }])));
  }

  function applyMembershipsFromGroup(nextGroup: AdminGroup) {
    setUsers((current) => current.map((user) => {
      const userInGroup = nextGroup.memberIds.includes(user.id);
      const nextGroups = userInGroup
        ? [...user.groups.filter((group) => group.id !== nextGroup.id), nextGroup].sort((left, right) => left.name.localeCompare(right.name))
        : user.groups.filter((group) => group.id !== nextGroup.id);
      return { ...user, groups: nextGroups };
    }));
    setEditDrafts((current) => Object.fromEntries(Object.entries(current).map(([userId, draft]) => {
      const nextIds = nextGroup.memberIds.includes(userId)
        ? [...new Set([...draft.groupIds, nextGroup.id])]
        : draft.groupIds.filter((id) => id !== nextGroup.id);
      return [userId, { ...draft, groupIds: nextIds }];
    })));
  }

  function applyMembershipsFromUser(nextUser: AdminDirectoryUser) {
    setGroups((current) => current.map((group) => {
      const userInGroup = nextUser.groups.some((entry) => entry.id === group.id);
      const memberIds = userInGroup
        ? [...new Set([...group.memberIds, nextUser.id])]
        : group.memberIds.filter((id) => id !== nextUser.id);
      return { ...group, memberIds, memberCount: memberIds.length };
    }));
    setGroupDrafts((current) => Object.fromEntries(Object.entries(current).map(([groupId, draft]) => {
      const belongs = nextUser.groups.some((group) => group.id === groupId);
      const memberIds = belongs
        ? [...new Set([...draft.memberIds, nextUser.id])]
        : draft.memberIds.filter((id) => id !== nextUser.id);
      return [groupId, { ...draft, memberIds }];
    })));
  }

  function updateRowDraft(userId: string, partial: Partial<UserDraft>) {
    setEditDrafts((current) => ({ ...current, [userId]: { ...current[userId], ...partial } }));
  }

  function updateGroupDraft(groupId: string, partial: Partial<GroupDraft>) {
    setGroupDrafts((current) => ({ ...current, [groupId]: { ...current[groupId], ...partial } }));
  }

  function validateCreateDraft() {
    if (!createDraft.name.trim()) return "Name is required";
    if (!createDraft.email.trim()) return "Email is required";
    if (createDraft.password.trim().length < 8) return "Password must be at least 8 characters";
    return null;
  }

  function validateRowDraft(draft: UserDraft) {
    if (!draft.name.trim()) return "Name is required";
    if (!draft.email.trim()) return "Email is required";
    if (draft.password && draft.password.trim().length < 8) return "Password must be at least 8 characters";
    return null;
  }

  function validateGroupDraft(draft: GroupDraft) {
    if (!draft.name.trim()) return "Group name is required";
    return null;
  }

  function createUser() {
    setCreateError(null);
    setCreateSuccess(null);
    const validationError = validateCreateDraft();
    if (validationError) {
      setCreateError(validationError);
      return;
    }

    startCreateTransition(async () => {
      try {
        const payload = await createAdminUser(createDraft);
        const createdUser = mapUser(payload);
        setUsers((current) => [...current, createdUser]);
        setEditDrafts((current) => ({ ...current, [createdUser.id]: toUserDraft(createdUser) }));
        applyMembershipsFromUser(createdUser);
        setCreateDraft({ name: "", email: "", password: "", role: "viewer", is_active: true, group_ids: [] });
        setCreateSuccess("User created");
      } catch (error) {
        setCreateError(error instanceof Error ? error.message : "Failed to create user");
      }
    });
  }

  function saveUser(userId: string) {
    const draft = editDrafts[userId];
    const validationError = validateRowDraft(draft);
    setRowErrors((current) => ({ ...current, [userId]: validationError }));
    if (validationError) {
      return;
    }

    setPendingUserId(userId);
    void (async () => {
      try {
        const payload: Record<string, unknown> = {
          name: draft.name,
          email: draft.email,
          role: draft.role,
          is_active: draft.isActive,
          group_ids: draft.groupIds
        };
        if (draft.password.trim()) {
          payload.password = draft.password.trim();
        }
        const updated = mapUser(await updateAdminUser(userId, payload));
        replaceUser(updated);
        applyMembershipsFromUser(updated);
        setRowErrors((current) => ({ ...current, [userId]: null }));
      } catch (error) {
        setRowErrors((current) => ({ ...current, [userId]: error instanceof Error ? error.message : "Failed to update user" }));
      } finally {
        setPendingUserId(null);
      }
    })();
  }

  function createGroup() {
    setGroupCreateError(null);
    setGroupCreateSuccess(null);
    const validationError = validateGroupDraft({
      name: groupCreateDraft.name,
      slug: groupCreateDraft.slug ?? "",
      description: groupCreateDraft.description,
      memberIds: groupCreateDraft.member_ids
    });
    if (validationError) {
      setGroupCreateError(validationError);
      return;
    }

    startGroupCreateTransition(async () => {
      try {
        const created = mapGroup(await createAdminGroup(groupCreateDraft));
        setGroups((current) => [...current, created]);
        setGroupDrafts((current) => ({ ...current, [created.id]: toGroupDraft(created) }));
        applyMembershipsFromGroup(created);
        setGroupCreateDraft({ name: "", slug: "", description: "", member_ids: [] });
        setGroupCreateSuccess("Group created");
      } catch (error) {
        setGroupCreateError(error instanceof Error ? error.message : "Failed to create group");
      }
    });
  }

  function archiveOrRestoreGroup(group: AdminGroup) {
    setPendingGroupId(group.id);
    void (async () => {
      try {
        const updated = mapGroup(await updateAdminGroup(group.id, {
          status: group.status === "active" ? "archived" : "active"
        }));
        replaceGroup(updated);
        applyMembershipsFromGroup(updated);
        setGroupErrors((current) => ({ ...current, [group.id]: null }));
      } catch (error) {
        setGroupErrors((current) => ({ ...current, [group.id]: error instanceof Error ? error.message : "Failed to update group" }));
      } finally {
        setPendingGroupId(null);
      }
    })();
  }

  function removeGroupPermanently(groupId: string) {
    setPendingGroupId(groupId);
    void (async () => {
      try {
        await deleteAdminGroup(groupId);
        removeGroup(groupId);
      } catch (error) {
        setGroupErrors((current) => ({ ...current, [groupId]: error instanceof Error ? error.message : "Failed to delete group" }));
      } finally {
        setPendingGroupId(null);
      }
    })();
  }

  function saveGroup(groupId: string) {
    const draft = groupDrafts[groupId];
    const validationError = validateGroupDraft(draft);
    setGroupErrors((current) => ({ ...current, [groupId]: validationError }));
    if (validationError) {
      return;
    }

    setPendingGroupId(groupId);
    void (async () => {
      try {
        const updated = mapGroup(await updateAdminGroup(groupId, {
          name: draft.name,
          slug: draft.slug,
          description: draft.description,
          member_ids: draft.memberIds
        }));
        replaceGroup(updated);
        applyMembershipsFromGroup(updated);
        setGroupErrors((current) => ({ ...current, [groupId]: null }));
      } catch (error) {
        setGroupErrors((current) => ({ ...current, [groupId]: error instanceof Error ? error.message : "Failed to update group" }));
      } finally {
        setPendingGroupId(null);
      }
    })();
  }

  return (
    <main className="space-y-6">
      <section className="rounded-[28px] border border-line/60 bg-panel/70 p-6 shadow-panel">
        <p className="text-xs uppercase tracking-[0.35em] text-mint/70">access</p>
        <h2 className="mt-3 font-display text-4xl font-extrabold text-cloud">Users and groups</h2>
        <p className="mt-3 max-w-3xl text-cloud/70">
          Roles define capability, and groups define membership. This phase adds persistent groups plus user-to-group assignment, ready for group-aware content visibility later.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-line/60 bg-panel/70 p-6 shadow-panel">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-mint/70">create user</p>
              <h3 className="mt-2 font-display text-2xl font-bold text-cloud">Add another operator</h3>
            </div>
            <div className="text-sm text-cloud/60">{users.length} total users</div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Name</span>
              <input value={createDraft.name} onChange={(event) => setCreateDraft((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand" />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Email</span>
              <input value={createDraft.email} onChange={(event) => setCreateDraft((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand" />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Password</span>
              <input type="password" value={createDraft.password} onChange={(event) => setCreateDraft((current) => ({ ...current, password: event.target.value }))} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand" />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Role</span>
              <select value={createDraft.role} onChange={(event) => setCreateDraft((current) => ({ ...current, role: event.target.value as AdminRole }))} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand">
                {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </label>
            <label className="flex items-end gap-3 rounded-2xl border border-line/60 bg-ink/35 px-4 py-3 text-sm text-cloud/80">
              <input type="checkbox" checked={createDraft.is_active} onChange={(event) => setCreateDraft((current) => ({ ...current, is_active: event.target.checked }))} />
              Active account
            </label>
            <GroupMenu
              label="Groups"
              selectedIds={createDraft.group_ids}
              groups={activeGroups}
              onToggle={(groupId) => setCreateDraft((current) => ({ ...current, group_ids: toggleId(current.group_ids, groupId) }))}
              emptyLabel="No groups yet"
            />
          </div>
          {createError ? <p className="mt-4 text-sm text-red-300">{createError}</p> : null}
          {createSuccess ? <p className="mt-4 text-sm text-mint/80">{createSuccess}</p> : null}
          <button type="button" onClick={createUser} disabled={isCreating} className="mt-6 rounded-full bg-accentBrand px-5 py-3 text-sm font-semibold text-ink disabled:opacity-50">
            {isCreating ? "Creating..." : "Create user"}
          </button>
        </div>

        <div className="rounded-[28px] border border-line/60 bg-panel/70 p-6 shadow-panel">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-mint/70">create group</p>
              <h3 className="mt-2 font-display text-2xl font-bold text-cloud">Cluster operators into teams</h3>
            </div>
            <div className="text-sm text-cloud/60">{groups.length} total groups</div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Name</span>
              <input value={groupCreateDraft.name} onChange={(event) => setGroupCreateDraft((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand" />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Slug</span>
              <input value={groupCreateDraft.slug ?? ""} onChange={(event) => setGroupCreateDraft((current) => ({ ...current, slug: event.target.value }))} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand" />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-mint/70">Description</span>
              <textarea value={groupCreateDraft.description} onChange={(event) => setGroupCreateDraft((current) => ({ ...current, description: event.target.value }))} className="min-h-28 w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand" />
            </label>
            <div className="rounded-2xl border border-line/60 bg-ink/35 px-4 py-3 text-sm text-cloud/80 md:col-span-2">
              <p className="text-xs uppercase tracking-[0.24em] text-mint/70">Initial members</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {sortedUsers.map((user) => (
                  <label key={user.id} className="flex items-center gap-3">
                    <input type="checkbox" checked={groupCreateDraft.member_ids.includes(user.id)} onChange={() => setGroupCreateDraft((current) => ({ ...current, member_ids: toggleId(current.member_ids, user.id) }))} />
                    {user.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
          {groupCreateError ? <p className="mt-4 text-sm text-red-300">{groupCreateError}</p> : null}
          {groupCreateSuccess ? <p className="mt-4 text-sm text-mint/80">{groupCreateSuccess}</p> : null}
          <button type="button" onClick={createGroup} disabled={isCreatingGroup} className="mt-6 rounded-full bg-accentBrand px-5 py-3 text-sm font-semibold text-ink disabled:opacity-50">
            {isCreatingGroup ? "Creating..." : "Create group"}
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-line/60 bg-panel/70 shadow-panel">
        <div className="border-b border-line/50 px-5 py-4 text-sm uppercase tracking-[0.24em] text-mint/70">Users</div>
        <table className="w-full border-collapse text-sm">
          <thead className="bg-ink/40 text-left text-cloud/60">
            <tr>
              <th className="px-5 py-4">User</th>
              <th className="px-5 py-4">Role</th>
              <th className="px-5 py-4">Groups</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Password</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((user) => {
              const draft = editDrafts[user.id];
              const isPending = pendingUserId === user.id;
              const isCurrentUser = user.id === currentUserId;
              return (
                <tr key={user.id} className="border-t border-line/40 align-top">
                  <td className="px-5 py-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <input value={draft.name} onChange={(event) => updateRowDraft(user.id, { name: event.target.value })} className="rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand" />
                      <input value={draft.email} onChange={(event) => updateRowDraft(user.id, { email: event.target.value })} className="rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand" />
                    </div>
                    <div className="mt-3 text-xs text-cloud/50">Created {user.createdAt}{isCurrentUser ? " | current session" : ""}</div>
                  </td>
                  <td className="px-5 py-4">
                    <select value={draft.role} onChange={(event) => updateRowDraft(user.id, { role: event.target.value as AdminRole })} className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand">
                      {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4 min-w-[260px]">
                    <GroupMenu
                      label="Membership"
                      selectedIds={draft.groupIds}
                      groups={activeGroups}
                      onToggle={(groupId) => updateRowDraft(user.id, { groupIds: toggleId(draft.groupIds, groupId) })}
                      emptyLabel="No groups yet"
                    />
                    {user.groups.length > 0 ? <p className="mt-3 text-xs text-cloud/55">Current: {user.groups.map((group) => group.name).join(", ")}</p> : null}
                  </td>
                  <td className="px-5 py-4">
                    <label className="flex items-center gap-3 rounded-2xl border border-line/60 bg-ink/35 px-4 py-3 text-sm text-cloud/80">
                      <input type="checkbox" checked={draft.isActive} onChange={(event) => updateRowDraft(user.id, { isActive: event.target.checked })} />
                      {draft.isActive ? "Active" : "Inactive"}
                    </label>
                  </td>
                  <td className="px-5 py-4">
                    <input type="password" value={draft.password} onChange={(event) => updateRowDraft(user.id, { password: event.target.value })} placeholder="Leave blank to keep current" className="w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand" />
                    {rowErrors[user.id] ? <p className="mt-2 text-xs text-red-300">{rowErrors[user.id]}</p> : null}
                  </td>
                  <td className="px-5 py-4">
                    <button type="button" onClick={() => saveUser(user.id)} disabled={isPending} className="rounded-full bg-accentBrand px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50">
                      {isPending ? "Saving..." : "Save"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-line/60 bg-panel/70 shadow-panel">
        <div className="border-b border-line/50 px-5 py-4 text-sm uppercase tracking-[0.24em] text-mint/70">Groups</div>
        <table className="w-full border-collapse text-sm">
          <thead className="bg-ink/40 text-left text-cloud/60">
            <tr>
              <th className="px-5 py-4">Group</th>
              <th className="px-5 py-4">Description</th>
              <th className="px-5 py-4">Members</th>
              <th className="px-5 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedGroups.map((group) => {
              const draft = groupDrafts[group.id];
              const isPending = pendingGroupId === group.id;
              return (
                <tr key={group.id} className="border-t border-line/40 align-top">
                  <td className="px-5 py-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <input value={draft.name} onChange={(event) => updateGroupDraft(group.id, { name: event.target.value })} className="rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand" />
                      <input value={draft.slug} onChange={(event) => updateGroupDraft(group.id, { slug: event.target.value })} className="rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand" />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-cloud/50"><span>{group.memberCount} members</span><span>{group.status}</span></div>
                  </td>
                  <td className="px-5 py-4">
                    <textarea value={draft.description} onChange={(event) => updateGroupDraft(group.id, { description: event.target.value })} className="min-h-28 w-full rounded-2xl border border-line bg-ink/60 px-4 py-3 text-sm text-cloud outline-none focus:border-accentBrand" />
                    {groupErrors[group.id] ? <p className="mt-2 text-xs text-red-300">{groupErrors[group.id]}</p> : null}
                  </td>
                  <td className="px-5 py-4">
                    <div className="grid gap-2 md:grid-cols-2">
                      {sortedUsers.map((user) => (
                        <label key={user.id} className="flex items-center gap-3">
                          <input type="checkbox" checked={draft.memberIds.includes(user.id)} onChange={() => updateGroupDraft(group.id, { memberIds: toggleId(draft.memberIds, user.id) })} />
                          {user.name}
                        </label>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => saveGroup(group.id)} disabled={isPending} className="rounded-full bg-accentBrand px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50">
                        {isPending ? "Saving..." : "Save"}
                      </button>
                      <button type="button" onClick={() => archiveOrRestoreGroup(group)} disabled={isPending} className="rounded-full border border-line/70 px-4 py-2 text-sm text-cloud/80 disabled:opacity-50">
                        {group.status === "active" ? "Archive" : "Restore"}
                      </button>
                      <button type="button" onClick={() => removeGroupPermanently(group.id)} disabled={isPending || group.status !== "archived"} className="rounded-full border border-red-400/50 px-4 py-2 text-sm text-red-200 disabled:opacity-40">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="rounded-[28px] border border-line/60 bg-panel/70 p-6 text-sm text-cloud/60 shadow-panel">
        Group membership is edited from dropdown selectors on users so assignment stays compact even when the directory grows. Group-level member editing remains available here for bulk changes.
      </section>
    </main>
  );
}
