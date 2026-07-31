import { ArrowLeft, Camera, Save } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";

import { babyProfile } from "./data";
import type { BabyProfile } from "./types";

type EditableBaby = Pick<
	BabyProfile,
	"nickname" | "birthDate" | "gender" | "bloodType"
>;

const fieldClass =
	"h-14 w-full rounded-2xl border border-transparent bg-surface-low px-4 outline-none focus:border-secondary/40 focus:ring-4 focus:ring-secondary/10";

export function EditBabyContent({
	onSave,
}: {
	onSave: (value: EditableBaby) => void;
}) {
	const [nickname, setNickname] = useState(babyProfile.nickname);
	const [birthDate, setBirthDate] = useState(babyProfile.birthDate);
	const [gender, setGender] = useState<BabyProfile["gender"]>(
		babyProfile.gender,
	);
	const [bloodType, setBloodType] = useState<BabyProfile["bloodType"]>(
		babyProfile.bloodType,
	);
	const [error, setError] = useState("");

	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!nickname.trim()) {
			setError("请输入宝宝昵称");
			return;
		}
		setError("");
		onSave({
			nickname: nickname.trim(),
			birthDate,
			gender,
			bloodType,
		});
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<a
					aria-label="返回我的"
					className="grid size-11 place-items-center rounded-full bg-card shadow-card"
					href="/me"
				>
					<ArrowLeft aria-hidden="true" size={20} />
				</a>
				<div>
					<p className="font-semibold text-primary text-sm">宝宝资料</p>
					<h1 className="font-bold text-2xl">编辑资料</h1>
				</div>
			</div>

			<form
				className="space-y-5 rounded-[2rem] bg-card p-6 shadow-card"
				onSubmit={submit}
			>
				<div className="relative mx-auto w-fit">
					<img
						alt={`${babyProfile.nickname}的头像`}
						className="size-28 rounded-full object-cover"
						src={babyProfile.avatar}
					/>
					<button
						aria-label="更换宝宝头像"
						className="absolute right-0 bottom-0 grid size-11 place-items-center rounded-full bg-primary-container text-primary shadow-card"
						type="button"
					>
						<Camera aria-hidden="true" size={19} />
					</button>
				</div>

				<Field id="edit-baby-nickname" label="宝宝昵称">
					<input
						className={fieldClass}
						id="edit-baby-nickname"
						maxLength={20}
						onChange={(event) => setNickname(event.target.value)}
						value={nickname}
					/>
				</Field>
				<Field id="edit-baby-birth-date" label="宝宝生日">
					<input
						className={fieldClass}
						id="edit-baby-birth-date"
						max="2026-07-31"
						onChange={(event) => setBirthDate(event.target.value)}
						type="date"
						value={birthDate}
					/>
				</Field>
				<Field id="edit-baby-gender" label="性别">
					<select
						className={fieldClass}
						id="edit-baby-gender"
						onChange={(event) =>
							setGender(event.target.value as BabyProfile["gender"])
						}
						value={gender}
					>
						<option>女</option>
						<option>男</option>
						<option>暂不填写</option>
					</select>
				</Field>
				<Field id="edit-baby-blood" label="血型">
					<select
						className={fieldClass}
						id="edit-baby-blood"
						onChange={(event) =>
							setBloodType(event.target.value as BabyProfile["bloodType"])
						}
						value={bloodType}
					>
						{(["A", "B", "AB", "O", "未知"] as const).map((value) => (
							<option key={value}>{value}</option>
						))}
					</select>
				</Field>

				{error ? (
					<p
						className="rounded-2xl bg-error-container px-4 py-3 text-destructive text-sm"
						role="alert"
					>
						{error}
					</p>
				) : null}

				<button
					className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-primary-container font-bold text-lg text-primary shadow-card"
					type="submit"
				>
					<Save aria-hidden="true" size={19} />
					保存资料
				</button>
				<p className="text-center text-muted-foreground text-xs">
					当前为本地课程演示，保存不会上传真实家庭资料。
				</p>
			</form>
		</div>
	);
}

function Field({
	children,
	id,
	label,
}: {
	children: ReactNode;
	id: string;
	label: string;
}) {
	return (
		<div className="grid gap-2">
			<label className="font-bold text-sm" htmlFor={id}>
				{label}
			</label>
			{children}
		</div>
	);
}
