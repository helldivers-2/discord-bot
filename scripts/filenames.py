import os
import glob
import argparse

def rename_files(directory, extension):
  # Use glob to get all files with the specified extension
  files = glob.glob(f"{directory}/*.{extension}")

  for file_path in files:
    # Get the base name of the file (file name with extension, without directories)
    base_name = os.path.basename(file_path)
    # Get the directory name of the file
    dir_name = os.path.dirname(file_path)

    # Replace spaces with underscores and lowercase the base name
    new_base_name = base_name.replace(' ', '_').replace('-', '').lower()

    # Strip underscores from the start and end
    new_base_name = new_base_name.strip('_')

    # Create the new file path
    new_file_path = os.path.join(dir_name, new_base_name)

    # Rename the file
    os.rename(file_path, new_file_path)

if __name__ == "__main__":
  parser = argparse.ArgumentParser(description='Rename files in a directory.')
  parser.add_argument('directory', type=str, help='The directory to process.')
  parser.add_argument('extension', type=str, help='The file extension to restrict to.')

  args = parser.parse_args()

  # Call the function with the directory and extension from the command-line arguments
  rename_files(args.directory, args.extension)
