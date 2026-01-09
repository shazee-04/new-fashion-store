import com.newfashionstore.entity.UserType;
import com.newfashionstore.util.HibernateUtil;
import org.hibernate.Session;
import org.hibernate.Transaction;

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

        session.persist(type1);
        session.persist(type2);

        // 4. Commit and Close
        transaction.commit();
        session.close();

        System.out.println("Success! 'user_type' table should be created.");
    }
}
