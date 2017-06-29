#!/bin/bash
feature=''
create_branch()
{
  echo -n "(waiting...)Your current branch is ....."
  git name-rev --name-only HEAD
  echo -n "Please Enter feature name _ feature/"
  read feature
  git checkout -b "feature/"$feature
}
commit_files()
{
  echo "git status..."
  git status
  echo -n ">> Enter which files to be commited "
  read files
  git add $files
  echo -n ">> Enter commit message: "
  read commit
  git commit -m "$commit"
}
Update_Develop()
{
  echo ">>git pull origin/develop for rebase"
  git pull --rebase origin develop
}
make_pull_request()
{
  echo -n "Please Enter feature name _ feature/"
  read feature
  echo ">> push feature branch to origin"
  git push origin 'feature/'$feature
  echo ">> Open pull request browser"
  python -m webbrowser -t 'http://ctf1.stw.net/ctf/code/git/projects.web_mobile_technical_part/scm.uwa20/reviews/create'
}
delete_branch()
{
  echo "Checkout develop branch"
  git checkout develop
  echo -n "Please Enter feature name _ feature/"
  read feature
  echo "Delete feature/"$feature "branch"
  git push origin :"feature/"$feature
}
while :
do
  echo "------------------------------------------"
  echo ">>> Please select menu"
  echo "                                          "
  echo "1. Create feature branch"
  echo "2. Commit files"
  echo "3. Update to develop"
  echo "4. Make Pull Request"
  echo "5. Delete feature branch"
  echo "0. Quit"
  echo "------------------------------------------"
  echo -n "Enter menu number :"
  read menu
  case $menu in
    1)
      echo " >> Create Feature branch "
      create_branch
      ;;
    2)
      commit_files
      ;;
    3)
      echo " >> Update to latest develop branch"
      Update_Develop
      ;;
    4)
      echo " >> Make pull Request"
     make_pull_request
      ;;
    5)
      echo ""
      delete_branch
      ;;
    0)
      echo "Bye~!"
      break
      ;;
  esac
done
$SHELL
