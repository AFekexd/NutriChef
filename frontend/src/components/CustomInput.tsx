const CustomInput = () => {
  return (
    <Input
      type="text"
      value={profileData.name}
      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
      className="pl-10 dark:text-gray-300"
      placeholder="Your name"
      required
    />
  );
};

export default CustomInput;
