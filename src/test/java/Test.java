import com.newfashionstore.entity.Status;
import com.newfashionstore.entity.UserType;
import com.newfashionstore.util.HibernateUtil;
import org.hibernate.Session;
import org.hibernate.Transaction;

import java.io.File;

public class Test {
    public static void main(String[] args) {
        testHibernate();
    }

    public static void testHibernate() {
        // 1. Open Session
        Session session = HibernateUtil.getSessionFactory().openSession();

        // 2. Begin Transaction
        Transaction transaction = session.beginTransaction();

        // 3. Save a new User Type to test
        UserType type1 = new UserType("Admin");
        UserType type2 = new UserType("Customer");

        Status status1 = new Status("Active");
        Status status2 = new Status("Inactive");

        session.persist(status1);
        session.persist(status2);

        session.persist(type1);
        session.persist(type2);

        // 4. Commit and Close
        transaction.commit();
        session.close();

        System.out.println("Success! 'user_type' table should be created.");
    }
}
