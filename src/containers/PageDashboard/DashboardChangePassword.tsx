import ButtonPrimary from "components/Button/ButtonPrimary";
import Input from "components/Input/Input";
import Label from "components/Label/Label";
import React, { FormEvent, useState } from "react";
import { useAuth } from "firebase/authManager";
import handleError from "utils/firebaseErrorHandler";
import swal from "sweetalert";

interface ChangePasswordProps {
  currentPassword: string;
  newPassword: string;
}

const DashboardChangePassword = () => {
  const { user, changePassword, checkPassword } = useAuth();
  const [formData, setFormData] = useState({ currentPassword: "", newPassword: "" } as ChangePasswordProps);
  const [loading, setLoading] = useState(false);

  function handleChange(event: FormEvent<HTMLInputElement>) {
    setFormData({ ...formData, [event.currentTarget.name]: event.currentTarget.value })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (formData.currentPassword.trim() === formData.newPassword.trim()) {
      swal("Choose a different password!", "New password cannot be the same as the old password.", "warning");
      return;
    }
    try {
      setLoading(true);
      const credential = await checkPassword(formData.currentPassword.trim());
      if (credential?.user) {
        await changePassword(formData.newPassword.trim());
        swal("Success!", `Password was changed successfully.`, "success");
      }
      else {
        swal("Error!", `Your current credentials could not be verified at the moment.`, "error");
      }
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      handleError(error);
    }
  }

  return (
    <div className="rounded-xl md:border md:border-neutral-100 dark:border-neutral-800 md:p-6">
      <form className="grid md:grid-cols-2 gap-6" action="#" method="post" onSubmit={handleSubmit}>
        <label className="block">
          <Label>Current password</Label>
          <Input required name="currentPassword" placeholder="***" type="password" className="mt-1" onChange={handleChange} />
        </label>
        <label className="block">
          <Label>New password</Label>
          <Input name="newPassword" type="password" className="mt-1" onChange={handleChange} />
        </label>
        <label className="block md:col-span-2">
          <Label> Email address</Label>
          <Input
            required
            readOnly={true}
            type="email"
            placeholder={user?.email || "example@example.com"}
            className="mt-1"
          />
        </label>
        <ButtonPrimary loading={loading} className="md:col-span-2" type="submit">
          Update password
        </ButtonPrimary>
      </form>
    </div>
  );
};

export default DashboardChangePassword;
