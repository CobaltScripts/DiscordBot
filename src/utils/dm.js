export async function sendDM(user, options) {
  try {
    const dmChannel = await user.createDM();
    const message = await dmChannel.send(options);
    return { success: true, message };
  } catch (error) {
    console.error(`Failed to DM user ${user.tag}:`, error.message);
    return { success: false, error: error.message };
  }
}
