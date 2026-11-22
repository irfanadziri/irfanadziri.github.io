# Using DiskPart for Disk Cleanup

> Underated Windows CMD tool used for hard disk cleanup. Useful for Windows fresh install or disk refresh.

- Type: Post
- Published: 2023-07-28
- Tags: windows
- Source: https://irfanadziri.dev/posts/using-diskpart-for-disk-cleanup/

---

## What is DiskPart?

Diskpart is a CLI utility built into Windows that gives users advanced control over their computer’s hard drives, partitions, and volumes. User may create, delete, format, and resize partitions of their hard drives easily with DiskPart. This is very useful especially for advance user like **PC Technicians**.

## Steps to Clean Hard Drive for Windows Fresh Install

1. Assuming you’re in Windows installation process. In disk selection window, tap `Shift` + `F10` to open CMD.
2. In CMD, type `diskpart` to open the utility.
3. Then, type `list disk` to list available disk connected to the computer.
4. Then, based on the list, select the disk you want to format by typing `select disk <disk-number>`.
5. Then, type `clean` to completely format the disk.
6. Then, type `exit` to exit the utility.
7. Finally, you can choose the disk to freshly install a new copy of Windows OS.

By following this step, the disk will be completely formatted, partitions deleted and disk uninitialized. If you do this in Windows OS instead of in installation process, you need to initalize the disk in **Disk Management** before you can use the disk again.

**Important note**: Diskpart is a powerful tool. Incorrect usage can lead to data loss. Always proceed with caution, and ensure you have backups of important data before making any significant drive changes.
